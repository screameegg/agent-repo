package cn.xcd.lobster.controller;

import cn.xcd.lobster.common.result.ApiResult;
import cn.xcd.lobster.model.vo.FileUploadVO;
import cn.xcd.lobster.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;

    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResult<FileUploadVO> uploadImage(@RequestParam("file") MultipartFile file) {
        return ApiResult.success(fileStorageService.uploadImage(file));
    }
}
