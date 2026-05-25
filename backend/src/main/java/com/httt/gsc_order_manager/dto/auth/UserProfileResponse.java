package com.httt.gsc_order_manager.dto.auth;

import com.httt.gsc_order_manager.entity.enums.Role;
import com.httt.gsc_order_manager.entity.enums.UserStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserProfileResponse {

    private Long id;
    private String fullName;
    private String email;
    private String department;
    private Role role;
    private UserStatus status;
}
