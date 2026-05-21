package com.httt.gsc_order_manager.service;

import com.httt.gsc_order_manager.dto.common.PagedResponse;
import com.httt.gsc_order_manager.dto.user.CreateUserRequest;
import com.httt.gsc_order_manager.dto.user.UpdateUserRequest;
import com.httt.gsc_order_manager.dto.user.UpdateUserRoleRequest;
import com.httt.gsc_order_manager.dto.user.UserResponse;
import com.httt.gsc_order_manager.entity.UserAccount;
import com.httt.gsc_order_manager.entity.enums.AuditAction;
import com.httt.gsc_order_manager.entity.enums.Role;
import com.httt.gsc_order_manager.entity.enums.UserStatus;
import com.httt.gsc_order_manager.mapper.UserMapper;
import com.httt.gsc_order_manager.repository.UserAccountRepository;
import com.httt.gsc_order_manager.security.AuthenticatedUser;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class UserService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public UserService(
        UserAccountRepository userAccountRepository,
        PasswordEncoder passwordEncoder,
        AuditLogService auditLogService
    ) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public PagedResponse<UserResponse> findAll(String keyword, Role role, UserStatus status, Pageable pageable) {
        Page<UserResponse> users = userAccountRepository.findAll(buildSpecification(keyword, role, status), pageable)
            .map(UserMapper::toResponse);
        return PagedResponse.<UserResponse>builder()
            .content(users.getContent())
            .page(users.getNumber())
            .size(users.getSize())
            .totalElements(users.getTotalElements())
            .totalPages(users.getTotalPages())
            .build();
    }

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        if (userAccountRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        UserAccount userAccount = userAccountRepository.save(UserMapper.toEntity(request, passwordEncoder));
        auditLogService.record(
            AuditAction.CREATE,
            UserAccount.class.getSimpleName(),
            userAccount.getId(),
            "Created user " + userAccount.getEmail()
        );
        return UserMapper.toResponse(userAccount);
    }

    @Transactional(readOnly = true)
    public UserResponse getById(Long id) {
        return UserMapper.toResponse(findUser(id));
    }

    @Transactional
    public UserResponse update(Long id, UpdateUserRequest request) {
        UserAccount userAccount = findUser(id);
        userAccountRepository.findByEmailIgnoreCase(request.getEmail())
            .filter(existing -> !existing.getId().equals(id))
            .ifPresent(existing -> {
                throw new IllegalArgumentException("Email already exists");
            });

        userAccount.setFullName(request.getFullName());
        userAccount.setEmail(request.getEmail());
        userAccount.setDepartment(request.getDepartment());

        auditLogService.record(
            AuditAction.UPDATE,
            UserAccount.class.getSimpleName(),
            userAccount.getId(),
            "Updated user " + userAccount.getEmail()
        );
        return UserMapper.toResponse(userAccount);
    }

    @Transactional
    public UserResponse disable(Long id) {
        UserAccount userAccount = findUser(id);
        if (isCurrentUser(id)) {
            throw new IllegalArgumentException("Cannot disable your own account");
        }
        userAccount.setStatus(UserStatus.DISABLED);
        auditLogService.record(
            AuditAction.DISABLE,
            UserAccount.class.getSimpleName(),
            userAccount.getId(),
            "Disabled user " + userAccount.getEmail()
        );
        return UserMapper.toResponse(userAccount);
    }

    @Transactional
    public UserResponse enable(Long id) {
        UserAccount userAccount = findUser(id);
        userAccount.setStatus(UserStatus.ACTIVE);
        auditLogService.record(
            AuditAction.UPDATE,
            UserAccount.class.getSimpleName(),
            userAccount.getId(),
            "Enabled user " + userAccount.getEmail()
        );
        return UserMapper.toResponse(userAccount);
    }

    @Transactional
    public UserResponse updateRole(Long id, UpdateUserRoleRequest request) {
        UserAccount userAccount = findUser(id);
        userAccount.setRole(request.getRole());
        auditLogService.record(
            AuditAction.UPDATE,
            UserAccount.class.getSimpleName(),
            userAccount.getId(),
            "Updated role for user " + userAccount.getEmail()
        );
        return UserMapper.toResponse(userAccount);
    }

    private UserAccount findUser(Long id) {
        return userAccountRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private boolean isCurrentUser(Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser authenticatedUser)) {
            return false;
        }
        return id.equals(authenticatedUser.getUserAccount().getId());
    }

    private Specification<UserAccount> buildSpecification(String keyword, Role role, UserStatus status) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(keyword)) {
                String value = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("fullName")), value),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), value),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("department")), value)
                ));
            }
            if (role != null) {
                predicates.add(criteriaBuilder.equal(root.get("role"), role));
            }
            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
