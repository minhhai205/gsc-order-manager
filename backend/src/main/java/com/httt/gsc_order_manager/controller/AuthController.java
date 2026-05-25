package com.httt.gsc_order_manager.controller;

import com.httt.gsc_order_manager.dto.auth.AuthResponse;
import com.httt.gsc_order_manager.dto.auth.LoginRequest;
import com.httt.gsc_order_manager.dto.auth.MessageResponse;
import com.httt.gsc_order_manager.dto.auth.RefreshTokenRequest;
import com.httt.gsc_order_manager.dto.auth.UserProfileResponse;
import com.httt.gsc_order_manager.entity.UserAccount;
import com.httt.gsc_order_manager.security.AuthenticatedUser;
import com.httt.gsc_order_manager.security.CustomUserDetailsService;
import com.httt.gsc_order_manager.security.JwtService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public AuthController(
        AuthenticationManager authenticationManager,
        JwtService jwtService,
        CustomUserDetailsService userDetailsService
    ) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (DisabledException ex) {
            throw new BadCredentialsException("Account is disabled");
        }

        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        return ResponseEntity.ok(buildAuthResponse(authenticatedUser));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        String username = jwtService.extractUsername(request.getToken());
        AuthenticatedUser authenticatedUser =
            (AuthenticatedUser) userDetailsService.loadUserByUsername(username);

        if (!jwtService.isTokenValid(request.getToken(), authenticatedUser)) {
            throw new BadCredentialsException("Invalid token");
        }

        return ResponseEntity.ok(buildAuthResponse(authenticatedUser));
    }

    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logout() {
        return ResponseEntity.ok(MessageResponse.builder().message("Logged out successfully").build());
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> me() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser authenticatedUser)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(toUserProfile(authenticatedUser.getUserAccount()));
    }

    private AuthResponse buildAuthResponse(AuthenticatedUser authenticatedUser) {
        return AuthResponse.builder()
            .accessToken(jwtService.generateAccessToken(authenticatedUser))
            .expiresIn(jwtService.getAccessTokenExpirationMs())
            .user(toUserProfile(authenticatedUser.getUserAccount()))
            .build();
    }

    private UserProfileResponse toUserProfile(UserAccount userAccount) {
        return UserProfileResponse.builder()
            .id(userAccount.getId())
            .fullName(userAccount.getFullName())
            .email(userAccount.getEmail())
            .department(userAccount.getDepartment())
            .role(userAccount.getRole())
            .status(userAccount.getStatus())
            .build();
    }
}
