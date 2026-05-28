package com.httt.gsc_order_manager.dto.audit;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAuditLogRequest {
    @NotBlank(message = "Action is required")
    private String action;

    @NotBlank(message = "Entity name is required")
    private String entityName;

    private String entityId;

    @NotBlank(message = "Detail is required")
    private String detail;
}
