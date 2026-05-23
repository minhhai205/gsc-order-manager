package com.httt.gsc_order_manager.dto.shippingbill;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateShippingBillRequest {

    @NotNull
    private LocalDate shippingDate;

    @Size(max = 255)
    private String destinationAddress;

    @Valid
    @NotEmpty
    private List<ShippingBillItemRequest> items;
}
