package com.httt.gsc_order_manager.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService customUserDetailsService;
    private final RestAuthenticationEntryPoint authenticationEntryPoint;
    private final RestAccessDeniedHandler accessDeniedHandler;

    public SecurityConfig(
        JwtAuthenticationFilter jwtAuthenticationFilter,
        CustomUserDetailsService customUserDetailsService,
        RestAuthenticationEntryPoint authenticationEntryPoint,
        RestAccessDeniedHandler accessDeniedHandler
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.customUserDetailsService = customUserDetailsService;
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
            )
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/api/auth/login", "/api/auth/refresh-token", "/api/auth/register").permitAll()
                .requestMatchers("/api/health").permitAll()
                .requestMatchers("/api/purchase-orders/*/inventory-check")
                    .hasAnyRole("SYSTEM_ADMIN", "ORDER_FULFILLMENT_STAFF")
                .requestMatchers("/api/purchase-orders/*/confirm-inventory-check")
                    .hasAnyRole("SYSTEM_ADMIN", "ORDER_FULFILLMENT_STAFF")
                .requestMatchers("/api/users/**", "/api/audit-logs/**", "/api/backups/**", "/api/restores/**")
                    .hasRole("SYSTEM_ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/equipment/**")
                    .hasAnyRole("SYSTEM_ADMIN", "WAREHOUSE_STAFF", "CONTRACTING_OFFICER")
                .requestMatchers(HttpMethod.GET, "/api/purchase-orders/**")
                    .hasAnyRole("SYSTEM_ADMIN", "CONTRACTING_OFFICER", "WAREHOUSE_STAFF", "ORDER_FULFILLMENT_STAFF")
                .requestMatchers("/api/purchase-orders/*/shipping-bill")
                    .hasAnyRole("SYSTEM_ADMIN", "WAREHOUSE_STAFF")
                .requestMatchers("/api/purchase-orders/*/inventory-check", "/api/purchase-orders/*/confirm-inventory-check", "/api/purchase-orders/*/exception-report")
                    .hasAnyRole("SYSTEM_ADMIN", "ORDER_FULFILLMENT_STAFF")
                .requestMatchers("/api/agencies/**", "/api/contracts/**", "/api/purchase-orders/**", "/api/rejection-letters/**")
                    .hasAnyRole("SYSTEM_ADMIN", "CONTRACTING_OFFICER")
                .requestMatchers("/api/fulfillment/**", "/api/exception-reports/**")
                    .hasAnyRole("SYSTEM_ADMIN", "ORDER_FULFILLMENT_STAFF")
                .requestMatchers("/api/equipment/**", "/api/shipping-bills/**")
                    .hasAnyRole("SYSTEM_ADMIN", "WAREHOUSE_STAFF")
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(customUserDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}
