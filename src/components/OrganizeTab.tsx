import React, { useState, useMemo } from 'react';
import {
  Search,
  Star,
  Phone,
  Mail,
  TrendingUp,
  Award,
  Filter,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Send,
  Calendar,
  DollarSign,
  CheckCircle,
  MapPin,
  Users,
  Package,
  AlertCircle,
  X,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { ServiceProvider, EventBooking } from '../types/events';

const mockServiceProviders: ServiceProvider[] = [
  {
    id: 'sp-1',
    name: 'Grand Hall Venues',
    category: 'venue',
    description: 'Premier event venues with modern facilities for conferences, weddings, and corporate events',
    expertise: 'Large events, conferences, weddings, 100-500 capacity',
    base_price: 2000000,
    rating: 4.8,
    reviews_count: 124,
    contact_email: 'info@grandhall.com',
    contact_phone: '+256-700-123456',
    portfolio_images: [],
    available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sp-2',
    name: 'Elite Tents & Decor',
    category: 'decor',
    description: 'Professional event decoration, tent rental, and themed setups',
    expertise: 'Weddings, galas, corporate events, creative themes',
    base_price: 450000,
    rating: 4.7,
    reviews_count: 78,
    contact_email: 'elite@tents.com',
    contact_phone: '+256-700-234567',
    portfolio_images: [],
    available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sp-3',
    name: 'Prime Ushers',
    category: 'ushering',
    description: 'Trained and professional ushering staff with crowd management expertise',
    expertise: 'Friendly, trained staff, crowd management, registration support',
    base_price: 120000,
    rating: 4.6,
    reviews_count: 46,
    contact_email: 'contact@primeushers.com',
    contact_phone: '+256-700-345678',
    portfolio_images: [],
    available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sp-4',
    name: 'SoundWorks Ltd',
    category: 'audio',
    description: 'Complete audio solutions including PA systems, mixing, and live sound engineering',
    expertise: 'PA systems, mixing, live sound, professional equipment',
    base_price: 600000,
    rating: 4.9,
    reviews_count: 98,
    contact_email: 'hello@soundworks.com',
    contact_phone: '+256-700-456789',
    portfolio_images: [],
    available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sp-5',
    name: 'CaterPro Solutions',
    category: 'catering',
    description: 'Full-service catering for events of all sizes with diverse menu options',
    expertise: 'Buffet, plated service, dietary options, large quantities',
    base_price: 350000,
    rating: 4.5,
    reviews_count: 65,
    contact_email: 'catering@caterpro.com',
    contact_phone: '+256-700-567890',
    portfolio_images: [],
    available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sp-6',
    name: 'LightUp Studios',
    category: 'photography',
    description: 'Professional event photography and videography with drone capabilities',
    expertise: 'Weddings, corporate events, portraits, drone footage',
    base_price: 800000,
    rating: 4.9,
    reviews_count: 112,
    contact_email: 'book@lightupstudios.com',
    contact_phone: '+256-700-678901',
    portfolio_images: [],
    available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sp-7',
    name: 'StarDJ Entertainment',
    category: 'entertainment',
    description: 'Professional DJs, MCs, and live entertainment services',
    expertise: 'Weddings, parties, corporate events, special effects',
    base_price: 500000,
    rating: 4.7,
    reviews_count: 89,
    contact_email: 'info@stardj.com',
    contact_phone: '+256-700-789012',
    portfolio_images: [],
    available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sp-8',
    name: 'SafeGuard Security',
    category: 'security',
    description: 'Professional event security and crowd control with trained personnel',
    expertise: 'Large events, VIP protection, access control, emergency response',
    base_price: 400000,
    rating: 4.8,
    reviews_count: 73,
    contact_email: 'security@safeguard.com',
    contact_phone: '+256-700-890123',
    portfolio_images: [],
    available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sp-9',
    name: 'RideShare Transport',
    category: 'transport',
    description: 'Event transportation and shuttle services for guest convenience',
    expertise: 'Guest shuttles, VIP transport, logistics coordination',
    base_price: 300000,
    rating: 4.6,
    reviews_count: 54,
    contact_email: 'ride@rideshare.com',
    contact_phone: '+256-700-901234',
    portfolio_images: [],
    available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

interface CartItem {
  provider: ServiceProvider;
  quantity: number;
}

interface CreateEventForm {
  eventName: string;
  eventDate: string;
  eventTime: string;
  location: string;
  description: string;
  expectedGuests: number;
  budget: number;
}

export default function OrganizeTab() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'create-event' | 'browse-services' | 'my-events'>('create-event');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'reviews'>('rating');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'confirm'>('details');
  const [eventDate, setEventDate] = useState('');
  const [eventNotes, setEventNotes] = useState('');
  const [createForm, setCreateForm] = useState<CreateEventForm>({
    eventName: '',
    eventDate: '',
    eventTime: '',
    location: '',
    description: '',
    expectedGuests: 100,
    budget: 5000000,
  });
  const [createdEvents, setCreatedEvents] = useState<Array<CreateEventForm & { id: string; createdAt: string }>>([]);

  const categories = ['all', 'venue', 'catering', 'decor', 'audio', 'photography', 'entertainment', 'security', 'transport', 'ushering'];

  const filteredProviders = useMemo(() => {
    return mockServiceProviders
      .filter((provider) => {
        const matchesCategory = selectedCategory === 'all' || provider.category === selectedCategory;
        const matchesSearch =
          provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          provider.expertise.toLowerCase().includes(searchQuery.toLowerCase()) ||
          provider.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch && provider.available;
      })
      .sort((a, b) => {
        if (sortBy === 'price') return a.base_price - b.base_price;
        if (sortBy === 'reviews') return b.reviews_count - a.reviews_count;
        return b.rating - a.rating;
      });
  }, [selectedCategory, searchQuery, sortBy]);

  const addToCart = (provider: ServiceProvider) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.provider.id === provider.id);
      if (existing) {
        return prev.map((item) =>
          item.provider.id === provider.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { provider, quantity: 1 }];
    });
  };

  const removeFromCart = (providerId: string) => {
    setCart((prev) => prev.filter((item) => item.provider.id !== providerId));
  };

  const updateQuantity = (providerId: string, change: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.provider.id === providerId ? { ...item, quantity: Math.max(1, item.quantity + change) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const totalCost = cart.reduce((sum, item) => sum + item.provider.base_price * item.quantity, 0);
  const serviceFee = totalCost * 0.05;
  const grandTotal = totalCost + serviceFee;

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.eventName || !createForm.eventDate) {
      alert('Please fill in all required fields');
      return;
    }
    const newEvent = {
      ...createForm,
      id: `event-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setCreatedEvents((prev) => [newEvent, ...prev]);
    setCreateForm({
      eventName: '',
      eventDate: '',
      eventTime: '',
      location: '',
      description: '',
      expectedGuests: 100,
      budget: 5000000,
    });
    alert('Event created successfully! Now browse services to complete your event setup.');
    setActiveView('browse-services');
  };

  const handleCheckout = () => {
    if (!user) {
      alert('Please sign in to complete booking.');
      return;
    }

    if (cart.length === 0) {
      alert('Please add services to your cart.');
      return;
    }

    if (checkoutStep === 'details') {
      if (!eventDate) {
        alert('Please select an event date.');
        return;
      }
      setCheckoutStep('confirm');
    } else {
      alert(
        `✓ Booking confirmed!\n\nEvent Date: ${eventDate}\nTotal: UGX ${grandTotal.toLocaleString()}\n\nService providers will contact you within 24 hours.`
      );
      setCart([]);
      setEventDate('');
      setEventNotes('');
      setShowCheckout(false);
      setCheckoutStep('details');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-row gap-4">
        <button
          onClick={() => setActiveView('create-event')}
          className={`md:flex-1 px-2 md:px-6 py-3 md:py-4 rounded-xl font-semibold transition-all flex md:flex-row flex-col items-center justify-center md:space-x-2 space-y-1 md:space-y-0 ${
            activeView === 'create-event'
              ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg'
              : 'glass-effect text-gray-300 hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          <span className="text-sm md:text-base">Create Event</span>
        </button>
        <button
          onClick={() => setActiveView('browse-services')}
          className={`md:flex-1 px-2 md:px-6 py-3 md:py-4 rounded-xl font-semibold transition-all flex md:flex-row flex-col items-center justify-center md:space-x-2 space-y-1 md:space-y-0 ${
            activeView === 'browse-services'
              ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg'
              : 'glass-effect text-gray-300 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4 md:w-5 md:h-5" />
          <span className="text-sm md:text-base">Book Services</span>
        </button>
        <button
          onClick={() => setActiveView('my-events')}
          className={`md:flex-1 px-2 md:px-6 py-3 md:py-4 rounded-xl font-semibold transition-all flex md:flex-row flex-col items-center justify-center md:space-x-2 space-y-1 md:space-y-0 ${
            activeView === 'my-events'
              ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg'
              : 'glass-effect text-gray-300 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4 md:w-5 md:h-5" />
          <div className="flex flex-col md:flex-row items-center md:space-x-2">
            <span className="text-sm md:text-base">My Events</span>
            {createdEvents.length > 0 && (
              <span className="px-1.5 py-0.5 bg-rose-500 text-white text-xs rounded-full font-bold">
                {createdEvents.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {activeView === 'create-event' && (
        <div className="glass-effect p-8 rounded-2xl max-w-3xl mx-auto w-full">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">Create Your Event</h2>
            <p className="text-gray-300">Set up a new event and book professional services to bring it to life.</p>
          </div>

          <form onSubmit={handleCreateEvent} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-semibold mb-2">Event Name *</label>
                <input
                  type="text"
                  value={createForm.eventName}
                  onChange={(e) => setCreateForm({ ...createForm, eventName: e.target.value })}
                  placeholder="e.g., Annual Gala Dinner"
                  className="w-full px-4 py-3 glass-effect rounded-lg border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Event Date *</label>
                <input
                  type="date"
                  value={createForm.eventDate}
                  onChange={(e) => setCreateForm({ ...createForm, eventDate: e.target.value })}
                  className="w-full px-4 py-3 glass-effect rounded-lg border border-white/20 text-white focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Time (Optional)</label>
                <input
                  type="time"
                  value={createForm.eventTime}
                  onChange={(e) => setCreateForm({ ...createForm, eventTime: e.target.value })}
                  className="w-full px-4 py-3 glass-effect rounded-lg border border-white/20 text-white focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Location *</label>
                <input
                  type="text"
                  value={createForm.location}
                  onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                  placeholder="Event venue or address"
                  className="w-full px-4 py-3 glass-effect rounded-lg border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Expected Guests</label>
                <input
                  type="number"
                  value={createForm.expectedGuests}
                  onChange={(e) => setCreateForm({ ...createForm, expectedGuests: parseInt(e.target.value) || 0 })}
                  min="1"
                  className="w-full px-4 py-3 glass-effect rounded-lg border border-white/20 text-white focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Budget (UGX)</label>
                <input
                  type="number"
                  value={createForm.budget}
                  onChange={(e) => setCreateForm({ ...createForm, budget: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="w-full px-4 py-3 glass-effect rounded-lg border border-white/20 text-white focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Event Description</label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Describe your event, theme, special requirements..."
                rows={4}
                className="w-full px-4 py-3 glass-effect rounded-lg border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all resize-none"
              />
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Create Event</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {activeView === 'browse-services' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-effect p-6 rounded-2xl">
              <h2 className="text-2xl font-bold text-white mb-4">Event Services Directory</h2>

              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search providers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 glass-effect rounded-xl border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-3 glass-effect rounded-xl border border-white/20 text-white bg-transparent focus:ring-2 focus:ring-rose-400 transition-all text-sm md:text-base"
                >
                  <option value="rating" className="bg-gray-800">
                    Top Rated
                  </option>
                  <option value="price" className="bg-gray-800">
                    Price (Low to High)
                  </option>
                  <option value="reviews" className="bg-gray-800">
                    Most Reviewed
                  </option>
                </select>
              </div>

              <div className="flex space-x-2 overflow-x-auto pb-2 mb-6">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all text-sm ${
                      selectedCategory === cat
                        ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white'
                        : 'glass-effect text-gray-300 hover:text-white'
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {filteredProviders.map((provider) => (
                  <div key={provider.id} className="glass-effect p-5 rounded-xl hover:bg-white/5 transition-all">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2 flex-wrap gap-2">
                          <h3 className="text-lg font-semibold text-white">{provider.name}</h3>
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full whitespace-nowrap">
                            {provider.category}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mb-3">{provider.description}</p>
                        <div className="flex items-center space-x-1 mb-3 text-sm text-gray-400">
                          <Award className="w-4 h-4 text-purple-400" />
                          <span>{provider.expertise}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-2 text-xs text-gray-400">
                          {provider.contact_phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="w-3 h-3" />
                              <span>{provider.contact_phone}</span>
                            </div>
                          )}
                          {provider.contact_email && (
                            <div className="flex items-center space-x-1">
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{provider.contact_email}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-start md:items-end justify-between space-y-4">
                        <div className="w-full md:w-auto text-right">
                          <div className="flex items-center space-x-3 justify-between md:justify-end mb-2">
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-white font-semibold">{provider.rating.toFixed(1)}</span>
                            </div>
                            {provider.reviews_count > 80 && (
                              <div className="flex items-center space-x-1 text-purple-400">
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-xs">Popular</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mb-3">({provider.reviews_count} reviews)</p>
                          <div className="text-sm text-gray-400 mb-3">Starting at</div>
                          <div className="text-2xl font-bold text-white">UGX {provider.base_price.toLocaleString()}</div>
                        </div>

                        <button
                          onClick={() => addToCart(provider)}
                          className="w-full md:w-auto px-6 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2 text-sm md:text-base"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredProviders.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No providers found matching your criteria</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="glass-effect p-6 rounded-2xl sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span>Cart</span>
                </h3>
                {cart.length > 0 && (
                  <span className="px-3 py-1 bg-rose-500 text-white text-sm font-bold rounded-full">
                    {cart.length}
                  </span>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-500 mx-auto mb-3 opacity-50" />
                  <p className="text-gray-400 text-sm">
                    Add service providers to build your event booking cart.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.provider.id} className="bg-white/5 p-4 rounded-xl">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium text-sm mb-1">{item.provider.name}</h4>
                            <p className="text-gray-400 text-xs">{item.provider.category}</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.provider.id)}
                            className="text-rose-400 hover:text-rose-300 flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.provider.id, -1)}
                              className="p-1 glass-effect rounded text-gray-300 hover:text-white transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-white font-semibold w-6 text-center text-sm">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.provider.id, 1)}
                              className="p-1 glass-effect rounded text-gray-300 hover:text-white transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-400">
                              {(item.provider.base_price / 100000).toFixed(1)}M × {item.quantity}
                            </div>
                            <div className="text-white font-semibold text-sm">
                              UGX {(item.provider.base_price * item.quantity).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-white/10 pt-4 space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Subtotal</span>
                      <span className="text-white font-semibold">UGX {totalCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Service Fee (5%)</span>
                      <span className="text-white">UGX {serviceFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg border-t border-white/10 pt-3">
                      <span className="text-white font-bold">Total</span>
                      <span className="text-white font-bold">UGX {grandTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {!showCheckout ? (
                    <button
                      onClick={() => setShowCheckout(true)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                    >
                      <Send className="w-5 h-5" />
                      <span>Proceed to Book</span>
                    </button>
                  ) : checkoutStep === 'details' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-300 text-sm mb-2 font-semibold">
                          <Calendar className="w-4 h-4 inline mr-2" />
                          Event Date *
                        </label>
                        <input
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className="w-full px-4 py-2 glass-effect rounded-lg border border-white/20 text-white focus:ring-2 focus:ring-rose-400 transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm mb-2 font-semibold">Additional Notes</label>
                        <textarea
                          value={eventNotes}
                          onChange={(e) => setEventNotes(e.target.value)}
                          placeholder="Special requirements..."
                          className="w-full px-4 py-2 glass-effect rounded-lg border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 transition-all resize-none"
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowCheckout(false)}
                          className="flex-1 px-4 py-2 glass-effect text-gray-300 rounded-lg hover:text-white transition-all text-sm font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCheckout}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all text-sm"
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-green-400 font-semibold text-sm mb-1">Review Your Booking</p>
                            <p className="text-green-300 text-xs">
                              Event Date: {new Date(eventDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCheckoutStep('details')}
                          className="flex-1 px-4 py-2 glass-effect text-gray-300 rounded-lg hover:text-white transition-all text-sm font-medium"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleCheckout}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all text-sm"
                        >
                          Confirm Booking
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-300 text-xs leading-relaxed">
                      <AlertCircle className="w-3 h-3 inline mr-2" />
                      Providers will contact you within 24 hours to confirm availability.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {activeView === 'my-events' && (
        <div className="space-y-6">
          {createdEvents.length === 0 ? (
            <div className="text-center py-16 glass-effect rounded-2xl">
              <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-white mb-2">No Events Yet</h3>
              <p className="text-gray-400 mb-6">Create your first event to get started organizing.</p>
              <button
                onClick={() => setActiveView('create-event')}
                className="px-6 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all inline-flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Create Event</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {createdEvents.map((event) => (
                <div key={event.id} className="glass-effect p-6 rounded-2xl hover:bg-white/5 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{event.eventName}</h3>
                      <div className="space-y-2 text-sm text-gray-400">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-rose-400" />
                          <span>{new Date(event.eventDate).toLocaleDateString()}</span>
                        </div>
                        {event.eventTime && (
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-rose-400" />
                            <span>{event.eventTime}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-rose-400" />
                          <span>{event.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">{event.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-3 mb-4 pt-4 border-t border-white/10">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Expected Guests</p>
                      <p className="text-lg font-bold text-white">{event.expectedGuests}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Budget</p>
                      <p className="text-lg font-bold text-white">UGX {(event.budget / 1000000).toFixed(1)}M</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all text-sm">
                      Book Services
                    </button>
                    <button className="px-4 py-2 glass-effect text-gray-300 rounded-lg hover:text-white transition-all text-sm">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
