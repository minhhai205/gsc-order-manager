package com.httt.gsc_order_manager.mapper;

import com.httt.gsc_order_manager.dto.user.CreateUserRequest;
import com.httt.gsc_order_manager.dto.user.UserResponse;
import com.httt.gsc_order_manager.entity.UserAccount;
import com.httt.gsc_order_manager.entity.enums.UserStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

public final class UserMapper {

    private UserMapper() {
    }

    public static UserAccount toEntity(CreateUserRequest request, PasswordEncoder passwordEncoder) {
        UserAccount userAccount = new UserAccount();
        userAccount.setFullName(request.getFullName());
        userAccount.setEmail(request.getEmail());
        userAccount.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        userAccount.setDepartment(request.getDepartment());
        userAccount.setRole(request.getRole());
        userAccount.setStatus(UserStatus.ACTIVE);
        return userAccount;
    }

    public static UserResponse toResponse(UserAccount userAccount) {
        return UserResponse.builder()
            .id(userAccount.getId())
            .fullName(userAccount.getFullName())
            .email(userAccount.getEmail())
            .department(userAccount.getDepartment())
            .role(userAccount.getRole())
            .status(userAccount.getStatus())
            .createdAt(userAccount.getCreatedAt())
            .updatedAt(userAccount.getUpdatedAt())
            .build();
    }
}
