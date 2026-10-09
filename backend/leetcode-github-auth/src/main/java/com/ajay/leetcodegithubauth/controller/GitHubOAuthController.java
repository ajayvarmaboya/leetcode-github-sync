package com.ajay.leetcodegithubauth.controller;

import com.ajay.leetcodegithubauth.dto.GitHubTokenResponse;
import com.ajay.leetcodegithubauth.dto.TokenExchangeRequest;
import com.ajay.leetcodegithubauth.service.GithubOAuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController 
@RequestMapping ("/api/auth/github")
public class GitHubOAuthController {
    private final GithubOAuthService githubOAuthService;

    public GitHubOAuthController(GithubOAuthService githubOAuthService) {
        this.githubOAuthService = githubOAuthService;
    }

    @PostMapping ("/exchange")
    public ResponseEntity<GitHubTokenResponse> exchangeCodeForToken(
        @Valid @RequestBody TokenExchangeRequest request) {
        GitHubTokenResponse tokenResponse 
            = githubOAuthService.exchangeCodeForToken(request);
        return ResponseEntity.ok(tokenResponse);
    }
    
}
