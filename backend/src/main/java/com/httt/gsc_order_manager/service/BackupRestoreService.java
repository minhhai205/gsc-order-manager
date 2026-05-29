package com.httt.gsc_order_manager.service;

import com.httt.gsc_order_manager.dto.backup.BackupRecordResponse;
import com.httt.gsc_order_manager.dto.backup.CreateBackupRequest;
import com.httt.gsc_order_manager.dto.backup.CreateRestoreRequest;
import com.httt.gsc_order_manager.dto.backup.RestoreRecordResponse;
import com.httt.gsc_order_manager.dto.common.PagedResponse;
import com.httt.gsc_order_manager.entity.BackupRecord;
import com.httt.gsc_order_manager.entity.RestoreRecord;
import com.httt.gsc_order_manager.entity.UserAccount;
import com.httt.gsc_order_manager.entity.enums.AuditAction;
import com.httt.gsc_order_manager.entity.enums.BackupStatus;
import com.httt.gsc_order_manager.entity.enums.BackupType;
import com.httt.gsc_order_manager.entity.enums.RestoreStatus;
import com.httt.gsc_order_manager.mapper.BackupMapper;
import com.httt.gsc_order_manager.repository.BackupRecordRepository;
import com.httt.gsc_order_manager.repository.RestoreRecordRepository;
import com.httt.gsc_order_manager.security.AuthenticatedUser;
import jakarta.persistence.criteria.Predicate;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class BackupRestoreService {

    private static final DateTimeFormatter FILE_TIMESTAMP_FORMATTER = DateTimeFormatter
        .ofPattern("yyyyMMdd_HHmmss")
        .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    private final BackupRecordRepository backupRecordRepository;
    private final RestoreRecordRepository restoreRecordRepository;
    private final AuditLogService auditLogService;
    private final String datasourceUrl;
    private final String datasourceUsername;
    private final String datasourcePassword;
    private final Path backupDirectory;
    private final String mysqldumpCommand;
    private final String mysqlCommand;

    public BackupRestoreService(
        BackupRecordRepository backupRecordRepository,
        RestoreRecordRepository restoreRecordRepository,
        AuditLogService auditLogService,
        @Value("${spring.datasource.url}") String datasourceUrl,
        @Value("${spring.datasource.username}") String datasourceUsername,
        @Value("${spring.datasource.password}") String datasourcePassword,
        @Value("${app.backup.directory:D:/gsc-order-manager-backups}") String backupDirectory,
        @Value("${app.backup.mysqldump-command:mysqldump}") String mysqldumpCommand,
        @Value("${app.backup.mysql-command:mysql}") String mysqlCommand
    ) {
        this.backupRecordRepository = backupRecordRepository;
        this.restoreRecordRepository = restoreRecordRepository;
        this.auditLogService = auditLogService;
        this.datasourceUrl = datasourceUrl;
        this.datasourceUsername = datasourceUsername;
        this.datasourcePassword = datasourcePassword;
        this.backupDirectory = Path.of(backupDirectory);
        this.mysqldumpCommand = mysqldumpCommand;
        this.mysqlCommand = mysqlCommand;
    }

    @Transactional(readOnly = true)
    public PagedResponse<BackupRecordResponse> findBackups(
        String keyword,
        BackupType type,
        BackupStatus status,
        Pageable pageable
    ) {
        Page<BackupRecordResponse> backups = backupRecordRepository
            .findAll(buildBackupSpecification(keyword, type, status), pageable)
            .map(BackupMapper::toResponse);
        return PagedResponse.<BackupRecordResponse>builder()
            .content(backups.getContent())
            .page(backups.getNumber())
            .size(backups.getSize())
            .totalElements(backups.getTotalElements())
            .totalPages(backups.getTotalPages())
            .build();
    }

    @Transactional(readOnly = true)
    public BackupRecordResponse getBackup(Long id) {
        return BackupMapper.toResponse(findBackup(id));
    }

    @Transactional
    public BackupRecordResponse createBackup(CreateBackupRequest request) {
        Instant startedAt = Instant.now();
        String backupCode = generateBackupCode(startedAt);
        String fileName = "gsc-order-manager_" + FILE_TIMESTAMP_FORMATTER.format(startedAt) + ".sql";
        Path filePath = backupDirectory.resolve(fileName).toAbsolutePath().normalize();

        BackupRecord record = new BackupRecord();
        record.setBackupCode(backupCode);
        record.setType(request.getType());
        record.setStatus(BackupStatus.RUNNING);
        record.setFileName(fileName);
        record.setFilePath(filePath.toString());
        record.setStartedAt(startedAt);
        record.setPerformedBy(currentActor());
        BackupRecord saved = backupRecordRepository.save(record);
        auditLogService.record(AuditAction.BACKUP, BackupRecord.class.getSimpleName(),
            saved.getId(), "Started backup " + saved.getBackupCode());

        try {
            if (request.getType() == BackupType.INCREMENTAL) {
                throw new IllegalArgumentException("Incremental backup is not supported yet");
            }
            Files.createDirectories(backupDirectory);
            DatabaseConnectionInfo connectionInfo = DatabaseConnectionInfo.fromJdbcUrl(datasourceUrl);
            runCommand(buildBackupCommand(connectionInfo), filePath.toFile(), null);
            saved.setFileSizeBytes(Files.size(filePath));
            saved.setChecksum(calculateSha256(filePath));
            saved.setStatus(BackupStatus.COMPLETED);
            saved.setCompletedAt(Instant.now());
            auditLogService.record(AuditAction.BACKUP, BackupRecord.class.getSimpleName(),
                saved.getId(), "Completed backup " + saved.getBackupCode());
        } catch (Exception ex) {
            saved.setStatus(BackupStatus.FAILED);
            saved.setCompletedAt(Instant.now());
            saved.setFailureReason(ex.getMessage());
            auditLogService.record(AuditAction.BACKUP, BackupRecord.class.getSimpleName(),
                saved.getId(), "Failed backup " + saved.getBackupCode() + ": " + ex.getMessage());
        }
        return BackupMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public FileSystemResource downloadBackup(Long id) {
        BackupRecord record = findBackup(id);
        if (record.getStatus() != BackupStatus.COMPLETED) {
            throw new IllegalArgumentException("Only completed backups can be downloaded");
        }
        Path filePath = Path.of(record.getFilePath()).toAbsolutePath().normalize();
        if (!Files.exists(filePath)) {
            throw new IllegalArgumentException("Backup file not found");
        }
        return new FileSystemResource(filePath);
    }

    @Transactional(readOnly = true)
    public PagedResponse<RestoreRecordResponse> findRestores(
        String keyword,
        RestoreStatus status,
        Pageable pageable
    ) {
        Page<RestoreRecordResponse> restores = restoreRecordRepository
            .findAll(buildRestoreSpecification(keyword, status), pageable)
            .map(BackupMapper::toResponse);
        return PagedResponse.<RestoreRecordResponse>builder()
            .content(restores.getContent())
            .page(restores.getNumber())
            .size(restores.getSize())
            .totalElements(restores.getTotalElements())
            .totalPages(restores.getTotalPages())
            .build();
    }

    @Transactional(readOnly = true)
    public RestoreRecordResponse getRestore(Long id) {
        return BackupMapper.toResponse(findRestore(id));
    }

    @Transactional
    public RestoreRecordResponse restore(Long backupId, CreateRestoreRequest request) {
        BackupRecord backup = findBackup(backupId);
        if (backup.getStatus() != BackupStatus.COMPLETED) {
            throw new IllegalArgumentException("Only completed backups can be restored");
        }
        Path filePath = Path.of(backup.getFilePath()).toAbsolutePath().normalize();
        if (!Files.exists(filePath)) {
            throw new IllegalArgumentException("Backup file not found");
        }
        if (StringUtils.hasText(backup.getChecksum()) && !backup.getChecksum().equals(calculateSha256(filePath))) {
            throw new IllegalArgumentException("Backup checksum does not match");
        }

        RestoreRecord record = new RestoreRecord();
        record.setRestoreCode(generateRestoreCode(Instant.now()));
        record.setBackupRecord(backup);
        record.setStatus(RestoreStatus.RUNNING);
        record.setStartedAt(Instant.now());
        record.setPerformedBy(currentActor());
        record.setNote(request.getNote());
        RestoreRecord saved = restoreRecordRepository.save(record);
        auditLogService.record(AuditAction.RESTORE, RestoreRecord.class.getSimpleName(),
            saved.getId(), "Started restore " + saved.getRestoreCode());

        try {
            DatabaseConnectionInfo connectionInfo = DatabaseConnectionInfo.fromJdbcUrl(datasourceUrl);
            runCommand(buildRestoreCommand(connectionInfo), null, filePath.toFile());
            saved.setStatus(RestoreStatus.COMPLETED);
            saved.setCompletedAt(Instant.now());
            auditLogService.record(AuditAction.RESTORE, RestoreRecord.class.getSimpleName(),
                saved.getId(), "Completed restore " + saved.getRestoreCode());
        } catch (Exception ex) {
            saved.setStatus(RestoreStatus.FAILED);
            saved.setCompletedAt(Instant.now());
            saved.setFailureReason(ex.getMessage());
            auditLogService.record(AuditAction.RESTORE, RestoreRecord.class.getSimpleName(),
                saved.getId(), "Failed restore " + saved.getRestoreCode() + ": " + ex.getMessage());
        }
        return BackupMapper.toResponse(saved);
    }

    private List<String> buildBackupCommand(DatabaseConnectionInfo connectionInfo) {
        return List.of(
            mysqldumpCommand,
            "--host=" + connectionInfo.host(),
            "--port=" + connectionInfo.port(),
            "--user=" + datasourceUsername,
            "--password=" + datasourcePassword,
            "--single-transaction",
            "--routines",
            "--triggers",
            connectionInfo.databaseName()
        );
    }

    private List<String> buildRestoreCommand(DatabaseConnectionInfo connectionInfo) {
        return List.of(
            mysqlCommand,
            "--host=" + connectionInfo.host(),
            "--port=" + connectionInfo.port(),
            "--user=" + datasourceUsername,
            "--password=" + datasourcePassword,
            connectionInfo.databaseName()
        );
    }

    private void runCommand(List<String> command, File outputFile, File inputFile) throws IOException, InterruptedException {
        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.redirectErrorStream(true);
        if (outputFile != null) {
            processBuilder.redirectOutput(outputFile);
        }
        if (inputFile != null) {
            processBuilder.redirectInput(inputFile);
        }
        Process process = processBuilder.start();
        String output = "";
        if (outputFile == null) {
            output = new String(process.getInputStream().readAllBytes());
        }
        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new IllegalStateException("Database command failed with exit code " + exitCode + ": " + output);
        }
    }

    private String calculateSha256(Path filePath) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (InputStream inputStream = Files.newInputStream(filePath);
                 DigestInputStream digestInputStream = new DigestInputStream(inputStream, digest)) {
                digestInputStream.transferTo(OutputStream.nullOutputStream());
            }
            return HexFormat.of().formatHex(digest.digest());
        } catch (IOException | NoSuchAlgorithmException ex) {
            throw new IllegalStateException("Could not calculate backup checksum", ex);
        }
    }

    private BackupRecord findBackup(Long id) {
        return backupRecordRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Backup record not found"));
    }

    private RestoreRecord findRestore(Long id) {
        return restoreRecordRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Restore record not found"));
    }

    private String generateBackupCode(Instant instant) {
        return "BK-" + FILE_TIMESTAMP_FORMATTER.format(instant);
    }

    private String generateRestoreCode(Instant instant) {
        return "RS-" + FILE_TIMESTAMP_FORMATTER.format(instant);
    }

    private String currentActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser authenticatedUser)) {
            return "System";
        }
        UserAccount userAccount = authenticatedUser.getUserAccount();
        return userAccount.getFullName() + " <" + userAccount.getEmail() + ">";
    }

    private Specification<BackupRecord> buildBackupSpecification(
        String keyword,
        BackupType type,
        BackupStatus status
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(keyword)) {
                String value = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("backupCode")), value),
                    cb.like(cb.lower(root.get("fileName")), value),
                    cb.like(cb.lower(root.get("performedBy")), value)
                ));
            }
            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Specification<RestoreRecord> buildRestoreSpecification(String keyword, RestoreStatus status) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(keyword)) {
                String value = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("restoreCode")), value),
                    cb.like(cb.lower(root.get("backupRecord").get("backupCode")), value),
                    cb.like(cb.lower(root.get("note")), value)
                ));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private record DatabaseConnectionInfo(String host, int port, String databaseName) {

        private static DatabaseConnectionInfo fromJdbcUrl(String jdbcUrl) {
            String normalized = jdbcUrl.substring("jdbc:".length());
            URI uri = URI.create(normalized.substring(0, normalized.indexOf("?") == -1
                ? normalized.length()
                : normalized.indexOf("?")));
            String databaseName = uri.getPath().replaceFirst("/", "");
            if (!StringUtils.hasText(databaseName)) {
                throw new IllegalArgumentException("Database name is missing in datasource URL");
            }
            return new DatabaseConnectionInfo(
                uri.getHost(),
                uri.getPort() == -1 ? 3306 : uri.getPort(),
                databaseName
            );
        }
    }
}
