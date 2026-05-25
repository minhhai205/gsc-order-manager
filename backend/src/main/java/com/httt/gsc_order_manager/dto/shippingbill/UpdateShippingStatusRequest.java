package com.httt.gsc_order_manager.dto.shippingbill;

import com.httt.gsc_order_manager.entity.enums.ShippingStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateShippingStatusRequest {

    @NotNull
    private ShippingStatus status;
}
