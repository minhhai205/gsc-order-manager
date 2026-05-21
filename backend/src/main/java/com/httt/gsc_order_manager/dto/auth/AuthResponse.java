package com.httt.gsc_order_manager.dto.auth;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthResponse {

    private String accessToken;
    private long expiresIn;
    private UserProfileResponse user;
}
