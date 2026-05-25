package com.httt.gsc_order_manager.dto.common;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PagedResponse<T> {

    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
}
