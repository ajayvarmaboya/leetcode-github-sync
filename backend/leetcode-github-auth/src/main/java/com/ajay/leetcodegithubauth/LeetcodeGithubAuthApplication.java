package com.ajay.leetcodegithubauth;


import com.ajay.leetcodegithubauth.config.GithubConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;


@SpringBootApplication
@EnableConfigurationProperties(GithubConfig.class)
public class LeetcodeGithubAuthApplication {

	public static void main(String[] args) {
		SpringApplication.run(LeetcodeGithubAuthApplication.class, args);
	}

}
