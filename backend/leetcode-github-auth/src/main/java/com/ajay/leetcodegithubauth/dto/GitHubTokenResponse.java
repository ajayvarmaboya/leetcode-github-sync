package com.ajay.leetcodegithubauth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record GitHubTokenResponse (

    @JsonProperty ("access_token")
    String accessToken, 

    @JsonProperty ("expires_in")
    Long expiresIn,

    @JsonProperty ("refresh_token")
    String refreshToken,

    @JsonProperty ("refresh_token_expires_in")
    Long refreshTokenExpiresIn,         

    @JsonProperty ("token_type")
    String tokenType,

    String scope

){
    
}
    

