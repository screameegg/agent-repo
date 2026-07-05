package cn.xcd.lobster.common.result;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Collections;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Pagination response payload")
public class PageResult<T> {

    @Schema(description = "Current page records")
    private List<T> records;

    @Schema(description = "Total record count", example = "100")
    private Long total;

    @Schema(description = "Current page number", example = "1")
    private Long current;

    @Schema(description = "Page size", example = "10")
    private Long size;

    public static <T> PageResult<T> of(List<T> records, Long total, Long current, Long size) {
        return new PageResult<>(records == null ? Collections.emptyList() : records, total, current, size);
    }
}
