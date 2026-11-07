import { supabase } from "./supabase-client.js";

const SESSION_KEY = "clipcanva-preview-session-v1";
const form = document.querySelector("#auth-form");
const nameField = document.querySelector("#name-field");
const nameInput = document.querySelector("#name");
const emailInput = document.querySelector("#email");
const passwordField = document.querySelector("#password-field");
const passwordInput = document.querySelector("#password");
const forgotButton = document.querySelector("#forgot-password");
const errorMessage = document.querySelector("#form-error");
const title = document.querySelector("#form-title");
const description = document.querySelector("#form-description");
const submitButton = document.querySelector("#continue-button");
const loginButton = document.querySelector("#login-mode");
const signupButton = document.querySelector("#signup-mode");
let mode = "login";

function showMessage(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
  errorMessage.classList.add("is-success");
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
  errorMessage.classList.remove("is-success");
  emailInput.setAttribute("aria-invalid", "true");
}

function clearMessage() {
  errorMessage.textContent = "";
  errorMessage.hidden = true;
  errorMessage.classList.remove("is-success");
  emailInput.removeAttribute("aria-invalid");
  nameInput.removeAttribute("aria-invalid");
  passwordInput.removeAttribute("aria-invalid");
}

function setMode(nextMode) {
  mode = nextMode;
  const signingUp = mode === "signup";
  const recovering = mode === "recovery";
  const requestingReset = mode === "forgot";

  nameField.hidden = !signingUp;
  nameInput.required = signingUp;
  passwordField.hidden = requestingReset;
  passwordInput.required = !requestingReset;
  forgotButton.hidden = signingUp || recovering || requestingReset;
  loginButton.hidden = recovering;
  signupButton.hidden = recovering;
  loginButton.classList.toggle("is-active", mode === "login");
  signupButton.classList.toggle("is-active", signingUp);
  loginButton.setAttribute("aria-pressed", String(mode === "login"));
  signupButton.setAttribute("aria-pressed", String(signingUp));

  if (signingUp) {
    title.textContent = "Make room for good ideas";
    description.textContent =
      "Create your Clipcanva account and save your work securely.";
    passwordInput.autocomplete = "new-password";
    passwordInput.placeholder = "At least 10 characters";
    submitButton.textContent = "Create account";
  } else if (recovering) {
    title.textContent = "Choose a new password";
    description.textContent =
      "Create a new password for your Clipcanva account.";
    passwordInput.autocomplete = "new-password";
    passwordInput.placeholder = "At least 10 characters";
    submitButton.textContent = "Update password";
  } else if (requestingReset) {
    title.textContent = "Reset your password";
    description.textContent =
      "We’ll email you a secure link to choose a new password.";
    submitButton.textContent = "Send reset link";
  } else {
    title.textContent = "Welcome back";
    description.textContent = "Log in to your Clipcanva cloud workspace.";
    passwordInput.autocomplete = "current-password";
    passwordInput.placeholder = "Enter your password";
    submitButton.textContent = "Log in to Clipcanva";
  }

  document.title = `${title.textContent} — Clipcanva`;
  clearMessage();
}

function redirectToWorkspace() {
  localStorage.removeItem(SESSION_KEY);
  window.location.replace("index.html");
}

function authErrorMessage(error) {
  if (error?.message?.toLowerCase().includes("invalid login credentials")) {
    return "That email and password combination didn’t match. Try again or reset your password.";
  }
  if (error?.message?.toLowerCase().includes("email not confirmed")) {
    return "Confirm your email using the link in your inbox, then log in.";
  }
  return error?.message || "Authentication failed. Please try again.";
}

loginButton.addEventListener("click", () => setMode("login"));
signupButton.addEventListener("click", () => setMode("signup"));
forgotButton.addEventListener("click", () => setMode("forgot"));

supabase.auth.onAuthStateChange((event, session) => {
  if (event === "PASSWORD_RECOVERY") setMode("recovery");
  if (event === "SIGNED_IN" && session && mode !== "recovery") {
    redirectToWorkspace();
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();
  submitButton.disabled = true;

  const email = emailInput.value.trim().toLowerCase();

  try {
    if (mode === "forgot") {
      if (!emailInput.validity.valid || !email) {
        showError("Enter the email address for your Clipcanva account.");
        emailInput.focus();
        return;
      }

      const redirectTo = new URL(
        "auth.html?mode=recovery",
        window.location.href,
      );
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo.href,
      });
      if (error) throw error;

      showMessage(
        "If an account exists for that email, a password-reset link is on its way.",
      );
      return;
    }

    if (mode === "recovery") {
      if (passwordInput.value.length < 10) {
        passwordInput.setAttribute("aria-invalid", "true");
        passwordInput.focus();
        showError("Choose a password with at least 10 characters.");
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordInput.value,
      });
      if (error) throw error;
      showMessage("Password updated. Taking you to your workspace…");
      window.setTimeout(redirectToWorkspace, 800);
      return;
    }

    if (!emailInput.validity.valid || !email) {
      emailInput.setAttribute("aria-invalid", "true");
      emailInput.focus();
      showError("Enter a valid email address.");
      return;
    }

    if (passwordInput.value.length < 10) {
      passwordInput.setAttribute("aria-invalid", "true");
      passwordInput.focus();
      showError("Choose a password with at least 10 characters.");
      return;
    }

    if (mode === "signup") {
      const name = nameInput.value.trim();
      if (name.length < 2) {
        nameInput.setAttribute("aria-invalid", "true");
        nameInput.focus();
        showError("Enter your name to create an account.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password: passwordInput.value,
        options: {
          data: { display_name: name.slice(0, 60) },
          emailRedirectTo: new URL("index.html", window.location.href).href,
        },
      });
      if (error) throw error;

      if (data.session) {
        redirectToWorkspace();
        return;
      }

      setMode("login");
      emailInput.value = email;
      showMessage(
        "Account created. Check your email to confirm your address, then log in.",
      );
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: passwordInput.value,
    });
    if (error) throw error;
  } catch (error) {
    showError(authErrorMessage(error));
  } finally {
    submitButton.disabled = false;
  }
});

for (const input of [nameInput, emailInput, passwordInput]) {
  input.addEventListener("input", clearMessage);
}

if (new URLSearchParams(window.location.search).get("mode") === "recovery") {
  setMode("recovery");
}

const { data: sessionData, error: sessionError } =
  await supabase.auth.getSession();
if (sessionError) {
  showError(sessionError.message);
} else if (sessionData.session && mode !== "recovery") {
  redirectToWorkspace();
}
