package com.httt.gsc_order_manager.dto.contract;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateAllowedEquipmentRequest {

    @NotEmpty
    private List<Long> allowedEquipmentIds;
}
