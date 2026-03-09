package middleware

import (
	"context"
	
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

//middleware basically runs before a handler and checks did user send a token,is the token valid,basically like a security gaurd
func Auth(secret []byte) func(http.HandlerFunc) http.HandlerFunc {

	return func(next http.HandlerFunc) http.HandlerFunc {

		return func(w http.ResponseWriter, r *http.Request) {

			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "MISSING AUTHORIZATION HEADER", http.StatusUnauthorized)
				return
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				http.Error(w, "INVALID AUTHORIZATION FORMAT", http.StatusUnauthorized)
				return
			}

			tokenString := parts[1]

			token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				return secret, nil
			})

			if err != nil || !token.Valid {
				http.Error(w, "INVALID TOKEN", http.StatusUnauthorized)
				return
			}

			claims := token.Claims.(jwt.MapClaims)

			ctx := context.WithValue(r.Context(), "user_id", claims["user_id"])
			ctx = context.WithValue(ctx, "role", claims["role"])

			next(w, r.WithContext(ctx))
		}
	}
}
//context is like a backpack which stores the user id , role etc...
