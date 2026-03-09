package handler



import (
	"encoding/json"
	"net/http"

	"resume-ranker/internal/service"
)

type AuthHandler struct {
	AuthService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{AuthService: authService}
}

func (h *AuthHandler) Signup(w http.ResponseWriter, r *http.Request) {

	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Role     string `json:"role"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "INVALID INPUT", http.StatusBadRequest)
		return
	}

	if input.Email == "" || input.Password == "" || input.Role == "" {
		http.Error(w, "MISSING FIELDS", http.StatusBadRequest)
		return
	}

	userID, err := h.AuthService.Signup(input.Email, input.Password, input.Role)
	if err != nil {
		http.Error(w, "USER ALREADY EXISTS", http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"id": userID,
	})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {

	if r.Method != http.MethodPost {
		http.Error(w, "METHOD NOT ALLOWED", http.StatusBadRequest)
		return
	}

	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "INVALID REQUEST BODY", http.StatusBadRequest)
		return
	}

	token, err := h.AuthService.Login(input.Email, input.Password)
	if err != nil {
		http.Error(w, "INVALID CREDENTIALS", http.StatusUnauthorized)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"token": token,
	})
}
