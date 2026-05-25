package com.httt.gsc_order_manager.entity;

import lombok.Getter;
import lombok.Setter;

import com.httt.gsc_order_manager.entity.enums.Role;
import com.httt.gsc_order_manager.entity.enums.UserStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

/**
 * Đại diện cho tài khoản người dùng nội bộ của hệ thống.
 * Entity này lưu thông tin đăng nhập, mật khẩu đã mã hóa, phòng ban, vai trò và trạng thái tài khoản.
 */
@Getter
@Setter
@Entity
@Table(name = "user_accounts")
public class UserAccount extends BaseEntity {

    @Column(nullable = false, length = 150)
    private String fullName;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(length = 100)
    private String department;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private UserStatus status = UserStatus.ACTIVE;
}
