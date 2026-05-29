package com.httt.gsc_order_manager.dto.backup;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateRestoreRequest {

    @Size(max = 1000)
    private String note;

    @AssertTrue(message = "Restore operation must be confirmed")
    private boolean confirmed;
}
