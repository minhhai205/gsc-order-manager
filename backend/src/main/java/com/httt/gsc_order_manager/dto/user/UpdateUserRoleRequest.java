package com.httt.gsc_order_manager.dto.user;

import com.httt.gsc_order_manager.entity.enums.Role;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateUserRoleRequest {

    @NotNull
    private Role role;
}
