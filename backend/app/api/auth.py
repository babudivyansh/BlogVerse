"""Authentication endpoints: signup, login, email verification."""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.email import generate_verification_token, send_verification_email, send_verification_success_email
from app.core.security import (
    create_access_token, get_current_user, hash_password, verify_password,
)
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserLogin, UserResponse, VerifyEmail

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(data: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Register a new user and send a verification email."""
    # Check uniqueness
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Username already taken")

    token = generate_verification_token()
    user = User(
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        verification_token=token,
        is_verified=False,  # Require verification
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    background_tasks.add_task(send_verification_email, user.email, token)
    return user


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate and return a JWT access token."""
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    
    if not user.is_verified:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, 
            "Please verify your email address before logging in. Check your inbox for a verification link."
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=access_token)


@router.post("/verify-email")
def verify_email(data: VerifyEmail, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Verify a user's email and send a confirmation email."""
    user = db.query(User).filter(User.verification_token == data.token).first()
    if not user:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid verification token")
    
    user_email = user.email
    user.is_verified = True
    user.verification_token = None
    db.commit()
    
    # Send success confirmation in background
    background_tasks.add_task(send_verification_success_email, user_email)
    
    return {"message": "Email verified successfully. You can now log in!"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user
