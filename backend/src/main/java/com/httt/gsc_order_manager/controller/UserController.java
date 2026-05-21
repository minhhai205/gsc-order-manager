package com.httt.gsc_order_manager.controller;

import com.httt.gsc_order_manager.dto.common.ApiResponse;
import com.httt.gsc_order_manager.dto.common.PagedResponse;
import com.httt.gsc_order_manager.dto.user.CreateUserRequest;
import com.httt.gsc_order_manager.dto.user.UpdateUserRequest;
import com.httt.gsc_order_manager.dto.user.UpdateUserRoleRequest;
import com.httt.gsc_order_manager.dto.user.UserResponse;
import com.httt.gsc_order_manager.entity.enums.Role;
import com.httt.gsc_order_manager.entity.enums.UserStatus;
import com.httt.gsc_order_manager.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<UserResponse>>> findAll(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) Role role,
        @RequestParam(required = false) UserStatus status,
        @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        PagedResponse<UserResponse> response = userService.findAll(keyword, role, status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> create(@Valid @RequestBody CreateUserRequest request) {
        UserResponse response = userService.create(request);
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.success("User created successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getById(@PathVariable Long id) {
        UserResponse response = userService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("User retrieved successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> update(
        @PathVariable Long id,
        @Valid @RequestBody UpdateUserRequest request
    ) {
        UserResponse response = userService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", response));
    }

    @PatchMapping("/{id}/disable")
    public ResponseEntity<ApiResponse<UserResponse>> disable(@PathVariable Long id) {
        UserResponse response = userService.disable(id);
        return ResponseEntity.ok(ApiResponse.success("User disabled successfully", response));
    }

    @PatchMapping("/{id}/enable")
    public ResponseEntity<ApiResponse<UserResponse>> enable(@PathVariable Long id) {
        UserResponse response = userService.enable(id);
        return ResponseEntity.ok(ApiResponse.success("User enabled successfully", response));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<ApiResponse<UserResponse>> updateRole(
        @PathVariable Long id,
        @Valid @RequestBody UpdateUserRoleRequest request
    ) {
        UserResponse response = userService.updateRole(id, request);
        return ResponseEntity.ok(ApiResponse.success("User role updated successfully", response));
    }
}
