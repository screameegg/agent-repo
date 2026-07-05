package cn.xcd.lobster.service;

import cn.xcd.lobster.model.vo.FileUploadVO;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {

    FileUploadVO uploadImage(MultipartFile file);
}
