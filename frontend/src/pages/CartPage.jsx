import { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart,
  Search,
  User,
  Menu,
  X,
  ArrowRight,
  Star,
  Heart,
  ChevronDown,
  ChevronRight,
  Zap,
  Truck,
  ShieldCheck,
  RefreshCw,
  Minus,
  Plus,
  CreditCard,
  Info,
  Trash2,
  Lock,
  Gift,
  ArrowLeft,
  CheckCircle,
  Smartphone,
  Building,
  MapPin,
  Mail,
  Phone,
  ChevronUp,
} from 'lucide-react';

// --- THEME CONFIGURATION ---
const THEME = {
  primary: '#163300', // Main color (Dark Green)
  secondary: '#f2c86c', // Accent Gold
  accent: '#65cf21', // Neon Green (Plug)
  darkBg: '#0f2400', // Dark Background
  lightBg: '#f9fafb', // Light Background
  white: '#ffffff',
  textMain: '#111827', // Gray-900
  textSub: '#4b5563', // Gray-600
  border: '#e5e7eb', // Gray-200
  success: '#16a34a',
  error: '#dc2626',
};

// --- MOCK DATA ---
const INITIAL_CART_ITEMS = [
  {
    id: 1,
    name: 'Argentina 2024 Home Jersey - Authentic',
    price: 2499,
    size: 'M',
    image:
      'https://images.unsplash.com/photo-1511252998634-1181285db21d?auto=format&fit=crop&q=80&w=400',
    quantity: 1,
    personalization: { name: 'MESSI', number: '10', patch: 'World Champions' },
  },
  {
    id: 2,
    name: 'AFA Training Shorts 2024',
    price: 899,
    size: 'M',
    image:
      'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?auto=format&fit=crop&q=80&w=400',
    quantity: 2,
    personalization: null,
  },
  {
    id: 3,
    name: 'Pro Grip Socks - White',
    price: 299,
    size: 'One Size',
    image:
      'https://images.unsplash.com/photo-1517466787929-bc90951d6dbb?auto=format&fit=crop&q=80&w=400',
    quantity: 1,
    personalization: null,
  },
];

const SA_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
  'Western Cape',
];

// PROCESS STEPS
const STEPS = [
  { id: 'cart', label: 'Cart', icon: ShoppingCart },
  { id: 'checkout', label: 'Checkout', icon: CreditCard },
  { id: 'complete', label: 'Done', icon: CheckCircle },
];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
  }).format(amount);
};

// --- COMPONENTS ---

// 1. Checkout Progress Bar
const CheckoutSteps = ({ currentStep }) => {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between relative">
        {/* Background Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>

        {/* Active Line */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#163300] -z-10 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
        ></div>

        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="flex flex-col items-center relative z-10 group">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                    ${
                                      isActive || isCompleted
                                        ? 'bg-[#163300] border-[#163300] text-[#f2c86c] shadow-lg scale-110'
                                        : 'bg-gray-50 border-gray-300 text-gray-400'
                                    }
                                `}
              >
                {isCompleted ? <CheckCircle size={18} /> : <StepIcon size={18} />}
              </div>
              <span
                className={`text-[10px] md:text-xs font-bold mt-2 uppercase tracking-wider transition-colors duration-300
                                    ${isActive ? 'text-[#163300]' : 'text-gray-400'}
                                `}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 2. Mobile Order Summary Accordion (For Checkout Step)
const MobileOrderSummary = ({ cartItems, subtotal, shipping, total }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden border-b border-gray-200 bg-gray-50 -mx-4 px-4 py-4 mb-6">
      <div
        className="flex justify-between items-center cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 text-[#163300] font-bold text-sm">
          <ShoppingCart size={16} />
          <span>{isOpen ? 'Hide' : 'Show'} Order Summary</span>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
        <span className="font-bold text-lg text-[#163300]">{formatCurrency(total)}</span>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-gray-200 animate-in slide-in-from-top-2">
          <div className="space-y-3 mb-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-3 text-sm">
                <div className="w-12 h-12 bg-white border border-gray-200 rounded overflow-hidden shrink-0 relative">
                  <img src={item.image} className="w-full h-full object-cover" />
                  <span className="absolute -top-1 -right-1 bg-gray-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 line-clamp-1">{item.name}</p>
                  <p className="text-gray-500 text-xs">{item.size}</p>
                </div>
                <p className="font-medium text-gray-900">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="space-y-2 text-sm text-gray-600 border-t border-gray-200 pt-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 3. Cart Item Component (Updated to allow delete in compact mode)
const CartItem = ({ item, updateQuantity, removeItem, isCompact = false }) => {
  return (
    <div
      className={`flex gap-3 ${
        isCompact ? 'py-4' : 'py-6'
      } border-b border-gray-100 last:border-0 group/item`}
    >
      <div
        className={`relative bg-gray-100 rounded-lg overflow-hidden shrink-0 ${
          isCompact ? 'w-16 h-20' : 'w-24 h-32 md:w-32 md:h-40'
        }`}
      >
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        {item.quantity > 1 && isCompact && (
          <span className="absolute top-0 right-0 bg-[#f2c86c] text-[#163300] text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-bl-lg">
            {item.quantity}
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start gap-2">
            <h3
              className={`font-bold text-[#163300] line-clamp-2 ${
                isCompact ? 'text-sm' : 'text-base md:text-lg'
              }`}
            >
              {item.name}
            </h3>
            {/* Remove Button - Now visible in compact mode too */}
            <button
              onClick={() => removeItem(item.id)}
              className={`text-gray-400 hover:text-red-500 transition-colors ${
                !isCompact ? 'hidden md:block' : 'p-1 hover:bg-gray-100 rounded-full'
              }`}
              aria-label="Remove item"
            >
              <Trash2 size={isCompact ? 16 : 18} />
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-1">
            Size: <span className="font-bold text-gray-800">{item.size}</span>
          </p>

          {item.personalization && (
            <div className="mt-1.5 p-1.5 bg-gray-50 rounded border border-gray-100 text-[10px] text-gray-600 inline-block">
              <p>
                Print:{' '}
                <strong>
                  {item.personalization.name} #{item.personalization.number}
                </strong>
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-end mt-2">
          {!isCompact ? (
            <div className="flex items-center border border-gray-200 rounded-lg h-10">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="px-2 h-full flex items-center justify-center text-gray-500 hover:text-[#163300] disabled:opacity-30"
                disabled={item.quantity <= 1}
              >
                <Minus size={14} />
              </button>
              <span className="px-2 font-bold text-center text-sm w-8">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="px-2 h-full flex items-center justify-center text-gray-500 hover:text-[#163300]"
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <div className="text-xs text-gray-500 font-medium">Qty: {item.quantity}</div>
          )}

          <div className="text-right">
            <p
              className={`font-bold text-[#163300] ${
                isCompact ? 'text-sm' : 'text-base md:text-lg'
              }`}
            >
              {formatCurrency(item.price * item.quantity)}
            </p>
          </div>
        </div>

        {!isCompact && (
          <button
            onClick={() => removeItem(item.id)}
            className="text-xs text-red-500 flex items-center gap-1 mt-3 md:hidden"
          >
            <Trash2 size={14} /> Remove
          </button>
        )}
      </div>
    </div>
  );
};

// 4. Unified Checkout Form (Merged Info & Payment)
const UnifiedCheckout = ({ onPay, onBack, total, cartItems, subtotal, shipping }) => {
  return (
    <div className="animate-in slide-in-from-right duration-300">
      {/* Mobile Order Summary Toggle */}
      <MobileOrderSummary
        cartItems={cartItems}
        subtotal={subtotal}
        shipping={shipping}
        total={total}
      />

      <div
        className="flex items-center gap-2 mb-6 cursor-pointer text-gray-500 hover:text-[#163300]"
        onClick={onBack}
      >
        <ArrowLeft size={16} /> <span>Return to Cart</span>
      </div>

      <h2 className="text-2xl font-bold text-[#163300] mb-6">Checkout Details</h2>

      <form
        className="space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          onPay();
        }}
      >
        {/* SECTION 1: SHIPPING & CONTACT */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Truck size={20} /> Shipping Address
          </h3>
          <div className="grid grid-cols-1 gap-4 mb-6">
            <input
              type="email"
              placeholder="Email Address"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#163300] transition-colors"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="First Name"
              className="col-span-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#163300]"
              required
            />
            <input
              type="text"
              placeholder="Last Name"
              className="col-span-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#163300]"
              required
            />
            <input
              type="text"
              placeholder="Address"
              className="col-span-2 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#163300]"
              required
            />
            <input
              type="text"
              placeholder="Apartment, suite, etc. (optional)"
              className="col-span-2 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#163300]"
            />
            <input
              type="text"
              placeholder="City"
              className="col-span-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#163300]"
              required
            />
            <input
              type="text"
              placeholder="Postal Code"
              className="col-span-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#163300]"
              required
            />
            <div className="col-span-2 relative">
              <select
                defaultValue=""
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#163300] appearance-none bg-white"
                required
              >
                <option value="" disabled>
                  Select Province
                </option>
                {SA_PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
              />
            </div>
            <input
              type="tel"
              placeholder="Phone"
              className="col-span-2 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-[#163300]"
              required
            />
          </div>
        </div>

        {/* SECTION 2: PAYMENT METHOD (Updated Colors) */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <CreditCard size={20} /> Payment Method
            </h3>
          </div>

          {/* PayFast / Ozow */}
          <label className="flex items-start gap-4 p-5 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="payment"
              className="w-5 h-5 text-[#f2c86c] focus:ring-[#f2c86c] mt-1"
              defaultChecked
            />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-gray-900">Secure Online Payment</span>
                <div className="flex gap-1">
                  <div className="h-5 px-1 bg-white border rounded text-[8px] flex items-center font-bold">
                    VISA
                  </div>
                  <div className="h-5 px-1 bg-blue-600 text-white border border-blue-600 rounded text-[8px] flex items-center font-bold">
                    Ozow
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-500 block">
                Redirect to PayFast for Credit Card or Instant EFT.
              </span>
            </div>
          </label>

          {/* PayJustNow */}
          <label className="flex items-start gap-4 p-5 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="payment"
              className="w-5 h-5 text-[#f2c86c] focus:ring-[#f2c86c] mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-gray-900">PayJustNow</span>
                <div className="h-5 px-1 bg-black text-[#65cf21] border border-black rounded text-[8px] flex items-center font-bold">
                  PayJustNow
                </div>
              </div>
              <span className="text-xs text-gray-500">
                3 interest-free installments of {formatCurrency(Math.ceil(total / 3))}.
              </span>
            </div>
          </label>

          {/* Bank Transfer (Manual) */}
          <label className="flex items-start gap-4 p-5 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="payment"
              className="w-5 h-5 text-[#f2c86c] focus:ring-[#f2c86c] mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-gray-900">Bank Transfer (EFT)</span>
                <Building size={16} className="text-gray-400" />
              </div>
              <span className="text-xs text-gray-500">
                Manual payment. Proof of payment required.
              </span>
            </div>
          </label>

          {/* COD */}
          <label className="flex items-start gap-4 p-5 cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="payment"
              className="w-5 h-5 text-[#f2c86c] focus:ring-[#f2c86c] mt-1"
            />
            <div className="flex-1">
              <span className="block font-bold text-gray-900">Cash on Delivery (COD)</span>
              <span className="text-xs text-gray-500">Pay cash upon receipt.</span>
            </div>
            <Truck size={16} className="text-gray-400" />
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-[#163300] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-black transition-colors flex items-center justify-center gap-2 text-lg"
        >
          <Lock size={20} /> Pay Now {formatCurrency(total)}
        </button>
      </form>
    </div>
  );
};

// 5. Success Page
const OrderSuccess = ({ onContinue }) => (
  <div className="text-center py-16 animate-in zoom-in duration-300 px-4">
    <div className="inline-flex p-6 bg-green-100 text-green-600 rounded-full mb-6">
      <CheckCircle size={64} />
    </div>
    <h2 className="text-3xl font-black text-[#163300] mb-2">Order Confirmed!</h2>
    <p className="text-gray-500 mb-8 max-w-md mx-auto">
      Thank you for your purchase. We've emailed your receipt and will send shipping updates soon.
    </p>

    <div className="bg-gray-50 max-w-md mx-auto rounded-xl p-6 border border-gray-200 mb-8 text-left shadow-sm">
      <div className="flex justify-between mb-4 border-b border-gray-200 pb-4">
        <span className="text-gray-500">Order Number</span>
        <span className="font-bold text-[#163300]">#JP-82931</span>
      </div>
      <div className="flex justify-between mb-2">
        <span className="text-gray-500">Date</span>
        <span className="font-medium text-gray-900">Oct 24, 2024</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Payment Method</span>
        <span className="font-medium text-gray-900">PayFast (Visa)</span>
      </div>
    </div>

    <button
      onClick={onContinue}
      className="px-8 py-3 bg-[#163300] text-white font-bold rounded-lg shadow-lg hover:bg-[#65cf21] hover:text-[#163300] transition-colors"
    >
      Continue Shopping
    </button>
  </div>
);

// 6. Sticky Summary (Desktop) - Adapts content based on step
const StickySummary = ({ cartItems, subtotal, shipping, total, currentStep }) => {
  return (
    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 sticky top-24">
      <h3 className="font-bold text-lg text-[#163300] mb-4">Order Summary</h3>

      {/* Mini Item List */}
      <div className="space-y-3 mb-6 max-h-60 overflow-y-auto scrollbar-thin pr-2">
        {cartItems.map((item) => (
          <div key={item.id} className="flex gap-3 text-sm">
            <div className="w-12 h-16 bg-gray-200 rounded overflow-hidden shrink-0 relative">
              <img src={item.image} className="w-full h-full object-cover" />
              <span className="absolute -top-1 -right-1 bg-gray-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-bold line-clamp-2 text-gray-900">{item.name}</p>
              <p className="text-gray-500 text-xs">{item.size}</p>
            </div>
            <p className="font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Shipping</span>
          <span>
            {shipping === 0 ? (
              <span className="text-[#65cf21]">Free</span>
            ) : (
              formatCurrency(shipping)
            )}
          </span>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="flex justify-between items-end">
          <span className="font-bold text-base text-gray-900">Total</span>
          <div className="text-right">
            <span className="block text-2xl font-bold text-[#163300]">{formatCurrency(total)}</span>
            <span className="text-[10px] text-gray-500">Including VAT</span>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="mt-6 flex justify-center gap-3 text-gray-400">
        <Lock size={16} /> <span className="text-xs">SSL Secured Checkout</span>
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function CartV1() {
  const [cartItems, setCartItems] = useState(INITIAL_CART_ITEMS);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState('cart'); // cart -> checkout -> complete
  const [isLoading, setIsLoading] = useState(false);

  // Logic Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingThreshold = 2000;
  const shippingCost = subtotal >= shippingThreshold ? 0 : 150;
  const total = subtotal + shippingCost;
  const amountToFreeShipping = Math.max(0, shippingThreshold - subtotal);

  const updateQuantity = (id, newQty) => {
    if (newQty < 1) return;
    setCartItems((items) =>
      items.map((item) => (item.id === id ? { ...item, quantity: newQty } : item)),
    );
  };

  const removeItem = (id) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  // Steps Navigation Handlers
  const goToCheckout = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentStep('checkout');
    setIsDrawerOpen(false); // Close drawer if opening from there
  };

  const handlePayNow = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentStep('complete');
      setCartItems([]); // Clear cart
    }, 2000);
  };

  const handleBackToStore = () => {
    // Reset to initial state for demo purposes
    setCartItems(INITIAL_CART_ITEMS);
    setCurrentStep('cart');
  };

  if (currentStep === 'complete') {
    return (
      <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col">
        <header className="py-4 border-b border-gray-100 flex justify-center">
          <div className="font-black text-2xl tracking-tighter text-[#163300]">
            JERSEY<span className="text-[#65cf21]">PLUG</span>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <OrderSuccess onContinue={handleBackToStore} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* 1. HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div
            className="font-black text-xl tracking-tighter text-[#163300] cursor-pointer"
            onClick={() => setCurrentStep('cart')}
          >
            JERSEY<span className="text-[#65cf21]">PLUG</span>
          </div>

          {/* Show Cart Icon only if not in checkout flow or if in cart step */}
          {currentStep === 'cart' && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ShoppingCart size={24} className="text-[#163300]" />
                <span className="absolute top-1 right-0 bg-[#f2c86c] text-[#163300] text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {cartItems.length}
                </span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 2. PROGRESS BAR (Visible on Checkout step) */}
      {currentStep === 'checkout' && (
        <div className="bg-gray-50 pt-6 pb-2 border-b border-gray-200 mb-6">
          <CheckoutSteps currentStep={currentStep} />
        </div>
      )}

      {/* 3. MAIN CONTENT */}
      <main className="container mx-auto px-4 py-6 lg:py-10">
        {/* State: EMPTY CART (Only relevant in Cart Step) */}
        {currentStep === 'cart' && cartItems.length === 0 ? (
          <div className="text-center py-20 animate-in fade-in zoom-in duration-300">
            <div className="inline-flex p-6 bg-gray-50 rounded-full mb-6 text-gray-300">
              <ShoppingCart size={48} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-8">Looks like you haven't added any gear yet.</p>
            <button
              onClick={handleBackToStore}
              className="px-8 py-3 bg-[#163300] text-white font-bold rounded-lg shadow-lg hover:bg-[#65cf21] hover:text-[#163300] transition-colors"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-12 max-w-6xl mx-auto">
            {/* LEFT COLUMN: DYNAMIC CONTENT */}
            <div className="flex-1">
              {/* VIEW: CART */}
              {currentStep === 'cart' && (
                <div className="animate-in slide-in-from-left duration-300">
                  <h1 className="text-3xl font-bold text-[#163300] mb-8">Shopping Cart</h1>
                  {/* Free Shipping Progress */}
                  <div className="mb-8 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    {amountToFreeShipping > 0 ? (
                      <p className="text-sm text-gray-600 mb-2">
                        Spend{' '}
                        <span className="font-bold text-[#163300]">
                          {formatCurrency(amountToFreeShipping)}
                        </span>{' '}
                        more for{' '}
                        <span className="text-[#65cf21] font-bold uppercase">Free Delivery</span>
                      </p>
                    ) : (
                      <p className="text-sm text-[#163300] font-bold mb-2 flex items-center gap-2">
                        <Truck size={16} /> You've unlocked Free Delivery!
                      </p>
                    )}
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#65cf21] transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (subtotal / shippingThreshold) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  {/* Items */}
                  <div className="border-t border-gray-100">
                    {cartItems.map((item) => (
                      <CartItem
                        key={item.id}
                        item={item}
                        updateQuantity={updateQuantity}
                        removeItem={removeItem}
                      />
                    ))}
                  </div>

                  {/* Mobile Checkout Button (Fixed at bottom) */}
                  <div className="lg:hidden mt-8">
                    <button
                      onClick={goToCheckout}
                      className="w-full bg-[#163300] text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2"
                    >
                      Checkout <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* VIEW: CHECKOUT (Unified Info & Payment) */}
              {currentStep === 'checkout' && (
                <UnifiedCheckout
                  onPay={handlePayNow}
                  onBack={() => setCurrentStep('cart')}
                  total={total}
                  cartItems={cartItems}
                  subtotal={subtotal}
                  shipping={shippingCost}
                />
              )}
            </div>

            {/* RIGHT COLUMN: SUMMARY (Sticky) */}
            <div className="hidden lg:block w-96 shrink-0">
              {currentStep === 'cart' ? (
                // Standard Cart Summary with Checkout Button
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 sticky top-24">
                  <h3 className="font-bold text-lg text-[#163300] mb-4">Order Summary</h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-bold text-gray-900">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Shipping</span>
                      <span className="font-bold text-gray-900">
                        {shippingCost === 0 ? 'Free' : formatCurrency(shippingCost)}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-4 mb-6">
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-base text-gray-900">Total</span>
                      <span className="block text-2xl font-bold text-[#163300]">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={goToCheckout}
                    className="w-full bg-[#163300] hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 group"
                  >
                    Proceed to Checkout{' '}
                    <ArrowRight
                      size={18}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-[10px] text-gray-400 text-center mb-3 uppercase tracking-wider font-bold">
                      Guaranteed Safe Checkout
                    </p>
                    <div className="flex justify-center gap-2 opacity-70 grayscale hover:grayscale-0 transition-all">
                      <div className="h-6 px-2 bg-white border rounded flex items-center text-[10px] font-bold">
                        Visa
                      </div>
                      <div className="h-6 px-2 bg-white border rounded flex items-center text-[10px] font-bold">
                        Mastercard
                      </div>
                      <div className="h-6 px-2 bg-white border rounded flex items-center text-[10px] font-bold text-red-600">
                        PayFast
                      </div>
                      <div className="h-6 px-2 bg-black border rounded flex items-center text-[10px] font-bold text-[#65cf21]">
                        PayJustNow
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Checkout Summary (Items list + Totals)
                <StickySummary
                  cartItems={cartItems}
                  subtotal={subtotal}
                  shipping={shippingCost}
                  total={total}
                  currentStep={currentStep}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* LOADING OVERLAY */}
      {isLoading && (
        <div className="fixed inset-0 z-[60] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-[#163300] rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-bold text-[#163300]">Processing Payment...</p>
          <p className="text-sm text-gray-500">Please do not close this window.</p>
        </div>
      )}

      {/* 3. CART DRAWER (Slide-over) - Same as before, logic connects to main flow */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isDrawerOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setIsDrawerOpen(false)}
      ></div>

      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <h2 className="font-bold text-lg text-[#163300] flex items-center gap-2">
            Cart{' '}
            <span className="bg-[#f2c86c] text-[#163300] text-xs px-2 py-0.5 rounded-full">
              {cartItems.length}
            </span>
          </h2>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Free Shipping Bar (Drawer) */}
          <div className="mb-6 pb-6 border-b border-gray-100">
            <div className="flex justify-between text-xs mb-1">
              <span>
                {amountToFreeShipping > 0
                  ? `Spend ${formatCurrency(amountToFreeShipping)} more for free shipping`
                  : 'Free Shipping Unlocked!'}
              </span>
              <span className="font-bold">
                {Math.round(Math.min(100, (subtotal / shippingThreshold) * 100))}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#65cf21]"
                style={{
                  width: `${Math.min(100, (subtotal / shippingThreshold) * 100)}%`,
                }}
              ></div>
            </div>
          </div>

          {cartItems.length > 0 ? (
            <div className="space-y-2">
              {cartItems.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  updateQuantity={updateQuantity}
                  removeItem={removeItem}
                  isCompact={true}
                />
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
              <ShoppingCart size={40} className="mb-4 opacity-50" />
              <p>Your cart is empty</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600 font-medium">Subtotal</span>
            <span className="text-xl font-bold text-[#163300]">{formatCurrency(subtotal)}</span>
          </div>
          <button
            onClick={goToCheckout}
            className="w-full bg-[#163300] text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-[#65cf21] hover:text-[#163300] transition-colors flex items-center justify-center gap-2"
            disabled={cartItems.length === 0}
          >
            Checkout <ArrowRight size={18} />
          </button>
          <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-gray-500">
            <span>or 3 interest-free payments with</span>
            <span className="font-bold text-[#65cf21] bg-black px-1 rounded">PayJustNow</span>
          </div>
        </div>
      </div>
    </div>
  );
}
