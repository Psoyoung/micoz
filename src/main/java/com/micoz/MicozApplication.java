package com.micoz;

import com.micoz.common.config.JwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(JwtProperties.class)
public class MicozApplication {

    public static void main(String[] args) {
        SpringApplication.run(MicozApplication.class, args);
    }
}
