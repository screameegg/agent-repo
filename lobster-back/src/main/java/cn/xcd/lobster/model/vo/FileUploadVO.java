package cn.xcd.lobster.model.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "文件上传结果")
public class FileUploadVO {

    @Schema(description = "公开访问地址")
    private String url;

    @Schema(description = "相对存储路径")
    private String path;

    @Schema(description = "原始文件名")
    private String originalName;

    @Schema(description = "文件类型")
    private String contentType;

    @Schema(description = "文件大小")
    private Long size;
}
