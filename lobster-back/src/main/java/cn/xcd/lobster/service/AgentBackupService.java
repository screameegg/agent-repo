package cn.xcd.lobster.service;

import cn.xcd.lobster.model.vo.AgentDetailVO;
import org.springframework.web.multipart.MultipartFile;

public interface AgentBackupService {

    byte[] exportZip(AgentDetailVO backup);

    AgentDetailVO parseZip(MultipartFile file);
}
