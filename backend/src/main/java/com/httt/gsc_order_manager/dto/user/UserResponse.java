package com.httt.gsc_order_manager.dto.user;

import com.httt.gsc_order_manager.entity.enums.Role;
import com.httt.gsc_order_manager.entity.enums.UserStatus;
import java.time.Instant;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserResponse {

    private Long id;
    private String fullName;
    private String email;
    private String department;
    private Role role;
    private UserStatus status;
    private Instant createdAt;
    private Instant updatedAt;
}
