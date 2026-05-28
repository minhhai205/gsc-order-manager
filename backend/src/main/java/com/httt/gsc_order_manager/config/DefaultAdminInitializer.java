package com.httt.gsc_order_manager.config;

import com.httt.gsc_order_manager.entity.UserAccount;
import com.httt.gsc_order_manager.entity.enums.Role;
import com.httt.gsc_order_manager.entity.enums.UserStatus;
import com.httt.gsc_order_manager.repository.UserAccountRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DefaultAdminInitializer implements CommandLineRunner {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;
    private final String adminFullName;
    private final String adminDepartment;

    public DefaultAdminInitializer(
        UserAccountRepository userAccountRepository,
        PasswordEncoder passwordEncoder,
        @Value("${app.security.default-admin.email}") String adminEmail,
        @Value("${app.security.default-admin.password}") String adminPassword,
        @Value("${app.security.default-admin.full-name}") String adminFullName,
        @Value("${app.security.default-admin.department}") String adminDepartment
    ) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
        this.adminFullName = adminFullName;
        this.adminDepartment = adminDepartment;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedUser(adminEmail, adminPassword, adminFullName, adminDepartment, Role.SYSTEM_ADMIN);
        seedUser("officer@gsc.local", "123", "Agent John Miller (CO)", "Contracting Office", Role.CONTRACTING_OFFICER);
        seedUser("fulfillment@gsc.local", "123", "Sarah Connor (Fulfillment)", "Logistics", Role.ORDER_FULFILLMENT_STAFF);
        seedUser("warehouse@gsc.local", "123", "Carl Jenkins (Warehouse)", "Warehouse", Role.WAREHOUSE_STAFF);
    }

    private void seedUser(String email, String password, String fullName, String department, Role role) {
        if (userAccountRepository.existsByEmailIgnoreCase(email)) {
            return;
        }
        UserAccount user = new UserAccount();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setDepartment(department);
        user.setRole(role);
        user.setStatus(UserStatus.ACTIVE);
        userAccountRepository.save(user);
    }
}
