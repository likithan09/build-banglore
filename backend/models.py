from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime

UserRole = Literal["seller", "buyer"]

# ------------------------------------------------------------------------------
# AUTH & USER MODELS (Compound Key: mobile + role)
# ------------------------------------------------------------------------------
class UserRegisterRequest(BaseModel):
    mobile: str = Field(..., description="10-digit Indian mobile number")
    password: str = Field(..., min_length=4)
    confirm_password: str = Field(..., min_length=4)
    preferred_language: str = Field(default="hi-IN")
    role: UserRole = Field(..., description="Chosen role: 'seller' or 'buyer'")

class UserLoginRequest(BaseModel):
    mobile: str = Field(..., description="10-digit Indian mobile number")
    password: str = Field(..., min_length=4)
    role: UserRole = Field(..., description="Account role to authenticate")

class User(BaseModel):
    id: str
    mobile: str
    role: UserRole
    password_hash: str
    preferred_language: str = "hi-IN"
    is_verified: bool = False
    verification_type: Optional[str] = None # 'gstin', 'gst_enrollment', 'pan'
    profile_completed: bool = False
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

# ------------------------------------------------------------------------------
# PROFILES & ONBOARDING (Mandatory Gate §3.5)
# ------------------------------------------------------------------------------
class ProfileSaveRequest(BaseModel):
    user_id: Optional[str] = None
    name: str = Field(..., min_length=1)
    business_name: str = Field(..., min_length=1)
    street_village: str = Field(default="")
    city_town: str = Field(default="")
    state: str = Field(..., min_length=1)
    pincode: str = Field(default="221001")
    location: Optional[str] = None
    preferred_language: str = Field(default="hi-IN")
    profile_photo: Optional[str] = None
    upi_id: Optional[str] = None
    bank_account: Optional[str] = None
    bank_ifsc: Optional[str] = None
    craft_category: Optional[str] = None
    experience_years: Optional[int] = None
    bio_story: Optional[str] = None

class SellerProfile(BaseModel):
    user_id: str
    name: str
    business_name: str
    street_village: str = ""
    city_town: str = ""
    state: str
    pincode: str
    location: str
    preferred_language: str = "hi-IN"
    profile_photo: Optional[str] = None
    gstin: Optional[str] = None
    gstin_status: str = "Not Linked" # 'Verified', 'Not Linked', 'Pending'
    gst_enrollment_id: Optional[str] = None
    gst_enrollment_status: str = "Not Linked" # 'Linked', 'Not Linked', 'Pending'
    verification_status: str = "Unverified"
    profile_completed: bool = True
    craft_category: Optional[str] = None
    experience_years: Optional[int] = None
    bio_story: Optional[str] = None
    upi_id: Optional[str] = None
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class BuyerProfile(BaseModel):
    user_id: str
    name: str
    business_name: str
    street_village: str = ""
    city_town: str = ""
    state: str
    pincode: str
    location: str
    preferred_language: str = "hi-IN"
    profile_photo: Optional[str] = None
    gstin: Optional[str] = None
    gstin_status: str = "Not Linked"
    pan: Optional[str] = None
    pan_status: str = "Not Linked" # 'Verified', 'Not Linked'
    verification_mobile: Optional[str] = None
    verification_status: str = "Unverified"
    profile_completed: bool = True
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

# ------------------------------------------------------------------------------
# VERIFICATION MODELS
# ------------------------------------------------------------------------------
class GSTINVerifyRequest(BaseModel):
    gstin: str
    consent: bool = True
    role: UserRole = "seller"
    user_id: Optional[str] = None

class PANVerifyRequest(BaseModel):
    pan: str
    name_as_per_pan: str
    dob_incorporation: Optional[str] = "1985-05-15"
    consent: bool = True
    reason: str = "Buyer onboarding and identity verification on KALASETU"
    mobile: str
    user_id: Optional[str] = None

class GSTEnrollmentStartRequest(BaseModel):
    user_id: str
    phone: str
    role: str = "seller"

# ------------------------------------------------------------------------------
# PRODUCT, INVENTORY & VISION MODELS
# ------------------------------------------------------------------------------
class Product(BaseModel):
    id: str
    seller_id: str
    seller_name: str
    seller_location: str
    title: str
    description: str
    category: str
    material: Optional[str] = None
    colour: Optional[str] = None
    size: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    price: float
    bulk_price: float
    stock: int
    unit: str = "piece"
    images: List[str] = Field(default_factory=list)
    ai_generated: bool = False
    approved_by_seller: bool = True
    cultural_story: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class ProductCreateRequest(BaseModel):
    title: str
    description: str
    category: str
    material: Optional[str] = None
    colour: Optional[str] = None
    size: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    price: float
    bulk_price: float
    stock: int
    unit: str = "piece"
    images: List[str] = Field(default_factory=list)
    cultural_story: Optional[str] = None

class VisionAnalyzeRequest(BaseModel):
    image_base64: Optional[str] = None
    image_url: Optional[str] = None
    hint_text: Optional[str] = None

# ------------------------------------------------------------------------------
# MATCHING & BULK ORDERS
# ------------------------------------------------------------------------------
class MatchingSearchRequest(BaseModel):
    requirement_text: Optional[str] = None
    product: str
    quantity: int
    max_price: float
    deadline_days: int = 15
    buyer_location: Optional[str] = "Delhi"

class SellerAllocation(BaseModel):
    seller_id: str
    seller_name: str
    location: str
    available_stock: int
    unit_price: float
    allocated_quantity: int
    total_cost: float
    match_score: int
    verification_status: str

class MatchingResponse(BaseModel):
    requirement: Dict[str, Any]
    total_requested: int
    total_allocated: int
    estimated_total_cost: float
    allocations: List[SellerAllocation]
    notes: str

class CreateMasterOrderRequest(BaseModel):
    buyer_id: str
    buyer_name: str
    buyer_mobile: str
    product: str
    total_quantity: int
    total_amount: float
    allocations: List[SellerAllocation]
    delivery_address: str

class SellerOrder(BaseModel):
    seller_order_id: str
    seller_id: str
    seller_name: str
    quantity: int
    unit_price: float
    subtotal: float
    status: str = "Requested" # 'Requested' | 'Accepted' | 'Production' | 'Ready' | 'Shipped' | 'Delivered'
    tracking_notes: Optional[str] = None

class MasterOrder(BaseModel):
    master_order_id: str
    buyer_id: str
    buyer_name: str
    buyer_mobile: str
    product: str
    total_quantity: int
    total_amount: float
    delivery_address: str
    status: str = "Requested"
    seller_orders: List[SellerOrder]
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

# ------------------------------------------------------------------------------
# VOICE & AI ASSISTANT MODELS
# ------------------------------------------------------------------------------
class VoiceTranscribeRequest(BaseModel):
    audio_base64: Optional[str] = None
    language_code: str = "hi-IN"
    mock_text: Optional[str] = None

class VoiceTranslateRequest(BaseModel):
    text: str
    source_language: str
    target_language: str

class VoiceSpeakRequest(BaseModel):
    text: str
    language_code: str = "hi-IN"
    target_dialect: Optional[str] = None

class VoiceIntentRequest(BaseModel):
    spoken_text: str
    language: str = "hi-IN"
    user_id: Optional[str] = None
    role: Optional[str] = "seller"
