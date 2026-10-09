package com.ajay.leetcodegithubauth.dto;

import jakarta.validation.constraints.NotBlank;

public record TokenExchangeRequest (
     @NotBlank 
    String code,

    @NotBlank 
    String codeVerifier,

    @NotBlank 
    String redirectUri

){

}

   
    

