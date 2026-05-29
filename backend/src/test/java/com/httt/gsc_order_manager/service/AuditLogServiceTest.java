package com.httt.gsc_order_manager.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.httt.gsc_order_manager.dto.auditlog.AuditLogResponse;
import com.httt.gsc_order_manager.dto.common.PagedResponse;
import com.httt.gsc_order_manager.entity.AuditLog;
import com.httt.gsc_order_manager.entity.UserAccount;
import com.httt.gsc_order_manager.entity.enums.AuditAction;
import com.httt.gsc_order_manager.entity.enums.Role;
import com.httt.gsc_order_manager.entity.enums.UserStatus;
import com.httt.gsc_order_manager.repository.AuditLogRepository;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private AuditLogService auditLogService;

    @Test
    void findAllReturnsPagedAuditLogs() {
        AuditLog auditLog = auditLog();
        PageRequest pageable = PageRequest.of(0, 20);
        when(auditLogRepository.findAll(any(Specification.class), eq(pageable)))
            .thenReturn(new PageImpl<>(List.of(auditLog), pageable, 1));

        PagedResponse<AuditLogResponse> response = auditLogService.findAll(
            "purchase",
            AuditAction.CREATE,
            "PurchaseOrder",
            "40",
            pageable
        );

        assertThat(response.getTotalElements()).isEqualTo(1);
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().getFirst().getAction()).isEqualTo(AuditAction.CREATE);
        assertThat(response.getContent().getFirst().getActorEmail()).isEqualTo("admin@gsc.local");
    }

    @Test
    void recordCreatesAuditLogWithoutActorWhenUnauthenticated() {
        ArgumentCaptor<AuditLog> auditLogCaptor = ArgumentCaptor.forClass(AuditLog.class);

        auditLogService.record(AuditAction.UPDATE, "Equipment", 20L, "Updated equipment stock");

        verify(auditLogRepository).save(auditLogCaptor.capture());
        AuditLog saved = auditLogCaptor.getValue();
        assertThat(saved.getAction()).isEqualTo(AuditAction.UPDATE);
        assertThat(saved.getEntityName()).isEqualTo("Equipment");
        assertThat(saved.getEntityId()).isEqualTo("20");
        assertThat(saved.getDetail()).isEqualTo("Updated equipment stock");
        assertThat(saved.getOccurredAt()).isNotNull();
        assertThat(saved.getActor()).isNull();
    }

    private AuditLog auditLog() {
        AuditLog auditLog = new AuditLog();
        auditLog.setId(10L);
        auditLog.setAction(AuditAction.CREATE);
        auditLog.setEntityName("PurchaseOrder");
        auditLog.setEntityId("40");
        auditLog.setActor(actor());
        auditLog.setOccurredAt(Instant.parse("2026-05-29T08:00:00Z"));
        auditLog.setDetail("Created purchase order PO-001");
        auditLog.setCreatedAt(Instant.parse("2026-05-29T08:00:00Z"));
        auditLog.setUpdatedAt(Instant.parse("2026-05-29T08:00:00Z"));
        return auditLog;
    }

    private UserAccount actor() {
        UserAccount actor = new UserAccount();
        actor.setId(1L);
        actor.setFullName("System Administrator");
        actor.setEmail("admin@gsc.local");
        actor.setPasswordHash("hashed-password");
        actor.setDepartment("Administration");
        actor.setRole(Role.SYSTEM_ADMIN);
        actor.setStatus(UserStatus.ACTIVE);
        return actor;
    }
}
