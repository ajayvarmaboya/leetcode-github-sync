
package com.ajay.leetcodegithubauth.service;

import com.ajay.leetcodegithubauth.config.GithubConfig;
import com.ajay.leetcodegithubauth.dto.GitHubTokenResponse;
import com.ajay.leetcodegithubauth.dto.TokenExchangeRequest;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;



import java.net.URI;
import java.util.Map;

@Service
public class GithubOAuthService {

    private static final String GITHUB_TOKEN_URL =
            "https://github.com/login/oauth/access_token";

    private final GithubConfig gitHubConfig;
    private final RestClient restClient;

    public GithubOAuthService(GithubConfig gitHubConfig) {
        this.gitHubConfig = gitHubConfig;
        this.restClient = RestClient.builder().build();
    }

    public GitHubTokenResponse exchangeCodeForToken(
            TokenExchangeRequest request) {

        MultiValueMap<String, String> formData =
                 new LinkedMultiValueMap<>();

        formData.add("client_id", gitHubConfig.getClientId());
        formData.add("client_secret", gitHubConfig.getClientSecret());
        formData.add("code", request.code());

        if(gitHubConfig.getRedirectUri() != null 
                && !gitHubConfig.getRedirectUri().isBlank()) {
            formData.add("redirect_uri", gitHubConfig.getRedirectUri());
        }

        if(request.codeVerifier()!=null
                && !request.codeVerifier().isBlank()) {
                        formData.add("code_verifier", request.codeVerifier());
        }

        return restClient.post()
                .uri(URI.create(GITHUB_TOKEN_URL))
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .accept(MediaType.APPLICATION_JSON)
                .body(formData)
                .retrieve()
                .body(GitHubTokenResponse.class);
    }   
}