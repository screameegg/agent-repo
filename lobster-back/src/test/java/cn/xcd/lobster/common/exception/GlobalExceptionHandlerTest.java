package cn.xcd.lobster.common.exception;

import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GlobalExceptionHandlerTest {

    @Test
    void businessExceptionSetsHttpStatusFromBusinessCode() throws Exception {
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new FailingController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        mvc.perform(get("/business-missing"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404))
                .andExpect(jsonPath("$.message").value("事件不存在"));
    }

    @Test
    void unhandledExceptionSetsHttp500() throws Exception {
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new FailingController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        mvc.perform(get("/internal-error"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value(500));
    }

    @RestController
    private static class FailingController {

        @GetMapping("/business-missing")
        void businessMissing() {
            throw new BusinessException(404, "事件不存在");
        }

        @GetMapping("/internal-error")
        void internalError() {
            throw new IllegalStateException("boom");
        }
    }
}
