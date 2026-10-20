import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  CalendarDays,
  Check,
  CircleAlert,
  Clock3,
  Compass,
  ExternalLink,
  FileText,
  Globe,
  Hotel,
  LoaderCircle,
  MapPin,
  Plane,
  Search,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';

const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const workspaceKey = 'travelbrain-workspace';
const itinerarySections = ['flights', 'hotels', 'itinerary'];

const destinations = [
  {
    city: 'Kyoto',
    country: 'Japan',
    label: 'Japan',
    description: 'Ancient lanes, quiet gardens and a thousand small rituals.',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=85',
    fallback: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=900&q=80',
    tag: 'Culture & calm',
  },
  {
    city: 'Lauterbrunnen',
    country: 'Switzerland',
    label: 'Switzerland',
    description: 'Alpine air, waterfall valleys and trails above the clouds.',
    image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=900&q=85',
    fallback: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80',
    tag: 'Mountain escape',
  },
  {
    city: 'Paris',
    country: 'France',
    label: 'France',
    description: 'Long lunches, riverside walks and streets made for wandering.',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=85',
    fallback: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=900&q=80',
    tag: 'City & culture',
  },
  {
    city: 'Cinque Terre',
    country: 'Italy',
    label: 'Italy',
    description: 'Sea-washed villages, winding paths and the slow art of aperitivo.',
    image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=900&q=85',
    fallback: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=900&q=80',
    tag: 'Coastal days',
  },
  {
    city: 'Ubud',
    country: 'Indonesia',
    label: 'Bali',
    description: 'Green rice terraces, temple mornings and island time.',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=900&q=85',
    fallback: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=900&q=80',
    tag: 'Island retreat',
  },
  {
    city: 'Chiang Mai',
    country: 'Thailand',
    label: 'Thailand',
    description: 'Night markets, northern flavors and mountains just beyond town.',
    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=900&q=85',
    fallback: 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=900&q=80',
    tag: 'Food & discovery',
  },
  {
    city: 'Singapore',
    country: 'Singapore',
    label: 'Singapore',
    description: 'Garden city skylines, hawker favorites and easy-going energy.',
    image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=900&q=85',
    fallback: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=900&q=80',
    tag: 'City break',
  },
  {
    city: 'Dubai',
    country: 'United Arab Emirates',
    label: 'Dubai',
    description: 'Desert horizons meet bold architecture and late-night dining.',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=85',
    fallback: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=900&q=80',
    tag: 'City & desert',
  },
  {
    city: 'Sydney',
    country: 'Australia',
    label: 'Australia',
    description: 'Harbour mornings, ocean pools and a city outdoors.',
    image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=900&q=85',
    fallback: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&w=900&q=80',
    tag: 'Coast & city',
  },
  {
    city: 'Santorini',
    country: 'Greece',
    label: 'Greece',
    description: 'Whitewashed paths, blue-water afternoons and sunset tables.',
    image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=900&q=85',
    fallback: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=900&q=80',
    tag: 'Island days',
  },
  {
    city: 'Malé',
    country: 'Maldives',
    label: 'Maldives',
    description: 'Turquoise lagoons, coral reefs and room to truly switch off.',
    image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=900&q=85',
    fallback: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=900&q=80',
    tag: 'Slow island living',
  },
];

const emptyForm = {
  departureCity: '',
  destinationCity: '',
  destinationCountry: '',
  departureDate: '',
  returnDate: '',
  travellers: '2',
  budget: '2500',
  preferences: '',
};

const optionCards = [
  {
    id: 'flights',
    number: '01',
    title: 'Flights',
    description: 'Explore flight records from the connected Aviationstack feed.',
    icon: Plane,
  },
  {
    id: 'hotels',
    number: '02',
    title: 'Hotels & stays',
    description: 'Find accommodation research from the connected web search.',
    icon: Hotel,
  },
  {
    id: 'itinerary',
    number: '03',
    title: 'Itinerary',
    description: 'Shape your days with the existing itinerary-planning agent.',
    icon: FileText,
  },
  {
    id: 'complete',
    number: '04',
    title: 'Complete trip plan',
    description: 'Bring flights, stays and a day-by-day plan together.',
    icon: Compass,
  },
];

function readWorkspace() {
  const stored = localStorage.getItem(workspaceKey);
  if (!stored) return { form: emptyForm, selectedDestination: null, savedTrips: [] };

  try {
    const parsed = JSON.parse(stored);
    return {
      form: { ...emptyForm, ...(parsed.form || {}) },
      selectedDestination: parsed.selectedDestination || null,
      savedTrips: Array.isArray(parsed.savedTrips) ? parsed.savedTrips : [],
    };
  } catch (error) {
    console.warn('Could not restore the saved Elsewhere workspace.', error);
    return { form: emptyForm, selectedDestination: null, savedTrips: [] };
  }
}

function TravelImage({ src, fallback, alt, className = '' }) {
  const [image, setImage] = useState(src);

  useEffect(() => setImage(src), [src]);

  return (
    <img
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        if (image !== fallback) setImage(fallback);
      }}
      src={image}
    />
  );
}

function currency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function displayDate(value, includeTime = false) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    ...(includeTime ? { timeStyle: 'short' } : {}),
    timeZone: includeTime ? undefined : 'UTC',
  }).format(parsed);
}

function tripDuration(departureDate, returnDate) {
  const days = Math.ceil(
    (Date.parse(`${returnDate}T00:00:00Z`) - Date.parse(`${departureDate}T00:00:00Z`))
      / 86_400_000,
  );
  return Math.max(1, days);
}

function parseDays(text = '') {
  const days = [];
  let current = null;

  for (const line of text.split('\n')) {
    const heading = line.trim().replace(/^(?:#{1,3}\s*|\*{1,2})/, '').replace(/\*{1,2}$/, '');
    const match = heading.match(/^(Day\s+\d+\s*[:\-–—]?.*)$/i);
    if (match) {
      current = { title: match[1], content: [] };
      days.push(current);
    } else if (current) {
      current.content.push(line);
    } else if (line.trim()) {
      current = { title: 'Trip overview', content: [line] };
      days.push(current);
    }
  }

  if (!days.length && text.trim()) {
    return [{ title: 'Trip overview', content: text.trim() }];
  }

  return days.map((day) => ({ ...day, content: day.content.join('\n').trim() }));
}

function MarkdownContent({ children }) {
  const markdown = children.replace(/[ \t]+\|[ \t]*\|[ \t]*/g, '|\n|');

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ node, ...props }) => (
            <div className="markdown-table-wrap"><table {...props} /></div>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

function App() {
  const [workspace, setWorkspace] = useState(readWorkspace);
  const [page, setPage] = useState('explore');
  const [search, setSearch] = useState('');
  const [activeOption, setActiveOption] = useState(null);
  const [results, setResults] = useState({});
  const [loadingOption, setLoadingOption] = useState(null);
  const [error, setError] = useState('');

  const { form, selectedDestination, savedTrips } = workspace;
  const filteredDestinations = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return destinations;
    return destinations.filter((destination) =>
      [destination.city, destination.country, destination.label]
        .some((value) => value.toLowerCase().includes(term)),
    );
  }, [search]);

  useEffect(() => {
    try {
      localStorage.setItem(workspaceKey, JSON.stringify(workspace));
    } catch (storageError) {
      console.warn('Could not save the Elsewhere workspace.', storageError);
    }
  }, [workspace]);

  function navigate(nextPage) {
    setPage(nextPage);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function selectDestination(destination) {
    setWorkspace((current) => ({
      ...current,
      selectedDestination: destination,
      form: {
        ...current.form,
        destinationCity: destination.city,
        destinationCountry: destination.country,
      },
    }));
    setActiveOption(null);
    setResults({});
    setError('');
    navigate('plan');
  }

  function updateForm(key, value) {
    setWorkspace((current) => ({
      ...current,
      form: { ...current.form, [key]: value },
    }));
  }

  function exploreSearch() {
    const term = search.trim();
    if (!term) {
      document.getElementById('destinations')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const exact = destinations.find((destination) =>
      [destination.city, destination.country, destination.label]
        .some((value) => value.toLowerCase() === term.toLowerCase()),
    );
    const destination = exact || filteredDestinations[0];
    if (destination) {
      selectDestination(destination);
      return;
    }
    selectDestination({
      city: term,
      country: '',
      label: term,
      description: 'A place of your own choosing.',
      image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=85',
      fallback: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
      tag: 'Your next adventure',
    });
  }

  async function requestPlan(option) {
    if (loadingOption) return;
    if (!form.departureCity.trim() || !form.destinationCity.trim()
      || !form.destinationCountry.trim() || !form.departureDate || !form.returnDate) {
      setError('Add your departure city, destination and both travel dates before choosing a planner.');
      return;
    }
    if (form.returnDate < form.departureDate) {
      setError('Your return date must be on or after your departure date.');
      return;
    }
    if (Number(form.travellers) < 1 || Number(form.travellers) > 12
      || Number(form.budget) <= 0) {
      setError('Enter 1–12 travellers and a budget greater than zero.');
      return;
    }

    setLoadingOption(option);
    setActiveOption(option);
    setError('');

    const selectedSections = option === 'complete'
      ? itinerarySections
      : [option];
    const body = {
      query: `${form.destinationCity.trim()}, ${form.destinationCountry.trim()}`,
      departure_city: form.departureCity.trim(),
      destination_city: form.destinationCity.trim(),
      destination_country: form.destinationCountry.trim(),
      departure_date: form.departureDate,
      return_date: form.returnDate,
      duration_days: tripDuration(form.departureDate, form.returnDate),
      budget: Number(form.budget),
      traveller_count: Number(form.travellers),
      preferences: form.preferences.trim(),
      sections: selectedSections,
    };

    try {
      const response = await fetch(`${apiUrl}/plan-trip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('The planner returned an unreadable response. Please try again.');
      }
      if (!response.ok) {
        const detail = Array.isArray(data.detail)
          ? data.detail.map((issue) => issue.msg).filter(Boolean).join(' ')
          : data.detail;
        throw new Error(detail || 'Your trip could not be planned. Please try again.');
      }

      setResults((current) => ({ ...current, [option]: data }));
      if (option === 'complete') {
        const savedTrip = {
          id: Date.now(),
          destination: workspace.selectedDestination,
          form: { ...form },
          plan: data,
        };
        setWorkspace((current) => ({
          ...current,
          savedTrips: [savedTrip, ...current.savedTrips].slice(0, 8),
        }));
      }
    } catch (requestError) {
      setError(
        requestError instanceof TypeError
          ? 'Could not reach the planner. Check that the backend is running and VITE_API_URL is correct.'
          : requestError.message,
      );
    } finally {
      setLoadingOption(null);
    }
  }

  function openSavedTrip(trip) {
    setWorkspace((current) => ({
      ...current,
      form: trip.form,
      selectedDestination: trip.destination,
    }));
    setResults({ complete: trip.plan });
    setActiveOption('complete');
    navigate('plan');
  }

  const result = activeOption ? results[activeOption] : null;
  const itineraryDays = result?.itinerary ? parseDays(result.itinerary) : [];

  return (
    <div className="site-shell">
      <header className="site-header">
        <button className="brand" onClick={() => navigate('explore')} type="button" aria-label="Elsewhere home">
          <span className="brand-mark"><Compass size={19} strokeWidth={1.8} /></span>
          <span>elsewhere<span>.</span></span>
        </button>
        <nav className="main-nav" aria-label="Main navigation">
          <button className={page === 'explore' ? 'nav-link active' : 'nav-link'} onClick={() => navigate('explore')} type="button">Explore</button>
          <button className={page === 'trips' ? 'nav-link active' : 'nav-link'} onClick={() => navigate('trips')} type="button">My Trips</button>
          <button className={page === 'about' ? 'nav-link active' : 'nav-link'} onClick={() => navigate('about')} type="button">About</button>
        </nav>
        <button className="header-cta" onClick={() => navigate(selectedDestination ? 'plan' : 'explore')} type="button">
          Plan a trip <ArrowUpRight size={16} />
        </button>
      </header>

      <main>
        {page === 'explore' && (
          <>
            <section className="hero">
              <TravelImage
                alt="Mountain lake and alpine peaks at sunrise"
                className="hero-image"
                fallback="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2200&q=80"
                src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2200&q=85"
              />
              <div className="hero-shade" />
              <div className="hero-copy page-wrap">
                <p className="hero-kicker"><span /> TRAVEL, THOUGHTFULLY PLANNED</p>
                <h1>Your next adventure<br />starts <em>here.</em></h1>
                <p className="hero-description">A little inspiration, a plan that feels like you, and more room for the good bits.</p>
                <div className="hero-search">
                  <MapPin size={19} />
                  <input
                    aria-label="Search a destination"
                    onChange={(event) => setSearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        exploreSearch();
                      }
                    }}
                    placeholder="Where would you like to go?"
                    value={search}
                  />
                  <button onClick={exploreSearch} type="button"><Search size={17} /><span>Explore destinations</span><ArrowRight size={17} /></button>
                </div>
                <p className="hero-note"><Globe size={14} /> Find a place. We’ll help shape the journey.</p>
              </div>
              <div className="hero-caption"><span>THE WORLD, A LITTLE CLOSER</span><span>01 / 11</span></div>
            </section>

            <section className="destination-section page-wrap" id="destinations">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">A GOOD PLACE TO BEGIN</p>
                  <h2>Where to next?</h2>
                  <p>Choose a place that’s been on your mind. The details can come later.</p>
                </div>
                <span className="destination-total">{filteredDestinations.length.toString().padStart(2, '0')} PLACES</span>
              </div>
              {filteredDestinations.length ? (
                <div className="destination-grid">
                  {filteredDestinations.map((destination, index) => (
                    <article className="destination-card" key={destination.label}>
                      <button className="destination-card-button" onClick={() => selectDestination(destination)} type="button">
                        <span className="destination-image-wrap">
                          <TravelImage
                            alt={`${destination.label} travel scenery`}
                            className="destination-image"
                            fallback={destination.fallback}
                            src={destination.image}
                          />
                          <span className="destination-tag">{destination.tag}</span>
                          <span className="destination-number">{String(index + 1).padStart(2, '0')}</span>
                        </span>
                        <span className="destination-copy">
                          <span><span className="destination-country">{destination.country || destination.label}</span><strong>{destination.label}</strong></span>
                          <span className="destination-arrow"><ArrowUpRight size={18} /></span>
                        </span>
                        <span className="destination-description">{destination.description}</span>
                        <span className="destination-explore">Explore <ArrowRight size={15} /></span>
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="search-empty">
                  <p>No featured places match “{search}”.</p>
                  <button className="text-button" onClick={exploreSearch} type="button">Plan a trip to {search} <ArrowRight size={15} /></button>
                </div>
              )}
            </section>

            <section className="promise-band">
              <div className="page-wrap promise-inner">
                <span className="promise-icon"><Sparkles size={20} /></span>
                <div><p className="eyebrow">YOUR TRIP, YOUR RHYTHM</p><h2>Thoughtful plans. Nothing made up.</h2></div>
                <p>Elsewhere uses the connected travel sources and planning agents. When a fare, rate or detail isn’t available, we’ll say so.</p>
              </div>
            </section>
          </>
        )}

        {page === 'plan' && selectedDestination && (
          <section className="planner-page page-wrap">
            <button className="back-link" onClick={() => navigate('explore')} type="button"><ArrowLeft size={16} /> Change destination</button>
            <div className="planner-banner">
              <TravelImage
                alt={`${selectedDestination.label} travel scenery`}
                className="planner-banner-image"
                fallback={selectedDestination.fallback}
                src={selectedDestination.image}
              />
              <div className="planner-banner-shade" />
              <div className="planner-banner-copy">
                <p className="hero-kicker"><span /> YOUR JOURNEY BEGINS</p>
                <h1>{form.destinationCity || selectedDestination.city}<em>{form.destinationCountry ? `, ${form.destinationCountry}` : ''}</em></h1>
                <p>Make the plan your own, then choose what you’d like to work on.</p>
              </div>
              <span className="banner-tag"><MapPin size={14} /> {selectedDestination.tag}</span>
            </div>

            <section className="trip-details-card">
              <div className="section-heading compact-heading">
                <div><p className="eyebrow">THE DETAILS</p><h2>Set your trip up</h2></div>
                <span className="secure-note"><Check size={15} /> Saved on this device</span>
              </div>
              <div className="trip-form-grid">
                <label className="form-field">
                  <span><Plane size={15} /> DEPARTING FROM</span>
                  <input autoComplete="address-level2" maxLength={120} onChange={(event) => updateForm('departureCity', event.target.value)} placeholder="e.g. San Francisco" required value={form.departureCity} />
                </label>
                <label className="form-field">
                  <span><MapPin size={15} /> DESTINATION CITY</span>
                  <input maxLength={120} onChange={(event) => updateForm('destinationCity', event.target.value)} placeholder="City or region" required value={form.destinationCity} />
                </label>
                <label className="form-field">
                  <span><Globe size={15} /> COUNTRY</span>
                  <input maxLength={120} onChange={(event) => updateForm('destinationCountry', event.target.value)} placeholder="Country" required value={form.destinationCountry} />
                </label>
                <label className="form-field">
                  <span><CalendarDays size={15} /> DEPARTURE</span>
                  <input onChange={(event) => updateForm('departureDate', event.target.value)} required type="date" value={form.departureDate} />
                </label>
                <label className="form-field">
                  <span><CalendarDays size={15} /> RETURN</span>
                  <input min={form.departureDate || undefined} onChange={(event) => updateForm('returnDate', event.target.value)} required type="date" value={form.returnDate} />
                </label>
                <label className="form-field">
                  <span><Users size={15} /> TRAVELLERS</span>
                  <input max="12" min="1" onChange={(event) => updateForm('travellers', event.target.value)} required type="number" value={form.travellers} />
                </label>
                <label className="form-field">
                  <span><Wallet size={15} /> TOTAL BUDGET (USD)</span>
                  <input min="1" onChange={(event) => updateForm('budget', event.target.value)} required step="50" type="number" value={form.budget} />
                </label>
                <label className="form-field preferences-field">
                  <span><Sparkles size={15} /> TRAVEL PREFERENCES</span>
                  <textarea maxLength={500} onChange={(event) => updateForm('preferences', event.target.value)} placeholder="Food, pace, accessibility needs, interests..." rows="3" value={form.preferences} />
                </label>
              </div>
            </section>

            <section className="planning-options">
              <div className="section-heading compact-heading">
                <div><p className="eyebrow">YOUR TRAVEL DESK</p><h2>What shall we plan?</h2><p>Choose one area for a focused result, or bring everything together.</p></div>
                <span className="step-count">01 <span>/</span> 04</span>
              </div>
              <div className="option-grid">
                {optionCards.map((option) => {
                  const OptionIcon = option.icon;
                  const isLoading = loadingOption === option.id;
                  return (
                    <button
                      className={`option-card ${activeOption === option.id ? 'selected' : ''} ${option.id === 'complete' ? 'complete-option' : ''}`}
                      disabled={Boolean(loadingOption)}
                      key={option.id}
                      onClick={() => requestPlan(option.id)}
                      type="button"
                    >
                      <span className="option-top"><span className="option-icon"><OptionIcon size={20} /></span><span className="option-number">{option.number}</span></span>
                      <strong>{option.title}</strong>
                      <span className="option-description">{option.description}</span>
                      <span className="option-action">{isLoading ? <><LoaderCircle className="spin" size={16} /> Working on it</> : <>Explore <ArrowUpRight size={16} /></>}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {error && <div className="error-panel" role="alert"><CircleAlert size={20} /><div><strong>We hit a snag</strong><p>{error}</p></div></div>}

            {loadingOption && (
              <div className="loading-panel" role="status">
                <LoaderCircle className="spin" size={22} />
                <div><strong>{loadingOption === 'complete' ? 'Bringing your trip together' : `Working on your ${loadingOption} plan`}</strong><p>Using your existing travel-planning agents and connected sources.</p></div>
                <span className="loading-dots"><i /><i /><i /></span>
              </div>
            )}

            {result && !loadingOption && (
              <section className="results-panel" aria-live="polite">
                <div className="results-title">
                  <div><p className="eyebrow">{activeOption === 'complete' ? 'YOUR COMPLETE TRIP PLAN' : `YOUR ${activeOption.toUpperCase()} PLAN`}</p><h2>{form.destinationCity}, {form.destinationCountry}</h2></div>
                  <div className="trip-facts">
                    <span><CalendarDays size={15} /> {displayDate(form.departureDate)} – {displayDate(form.returnDate)}</span>
                    <span><Users size={15} /> {form.travellers} travellers</span>
                    <span><Wallet size={15} /> {currency(Number(form.budget))} budget</span>
                  </div>
                </div>

                {(activeOption === 'flights' || activeOption === 'complete') && (
                  <section className="result-block">
                    <div className="result-block-heading"><span className="result-icon flight-result-icon"><Plane size={19} /></span><div><p className="eyebrow">GETTING THERE</p><h3>Flight records</h3></div></div>
                    <p className="source-disclosure">Aviationstack records are shown as returned by the connected feed. This integration currently does not filter records by your route or dates and does not provide fares.</p>
                    {result.flights?.length ? (
                      <div className="flight-results">
                        {result.flights.map((flight, index) => (
                          <article className="flight-result" key={`${flight.flight_number}-${index}`}>
                            <div className="flight-result-title"><span className="flight-mark"><Plane size={17} /></span><div><strong>{flight.airline}</strong><small>{flight.flight_number !== 'Not provided' ? flight.flight_number : 'Flight number unavailable'}</small></div><span className="flight-status">{flight.status}</span></div>
                            <div className="flight-stations"><div><small>FROM</small><strong>{flight.departure}</strong><span>{displayDate(flight.departure_time, true) || 'Departure time unavailable'}</span></div><ArrowRight size={17} /><div><small>TO</small><strong>{flight.arrival}</strong><span>{displayDate(flight.arrival_time, true) || 'Arrival time unavailable'}</span></div></div>
                            <div className="flight-unavailable"><span><Clock3 size={14} /> {flight.duration || 'Duration unavailable'}</span><span>Fare unavailable from source</span></div>
                          </article>
                        ))}
                      </div>
                    ) : <p className="empty-state">The connected source returned no flight records for this request.</p>}
                  </section>
                )}

                {(activeOption === 'hotels' || activeOption === 'complete') && (
                  <section className="result-block">
                    <div className="result-block-heading"><span className="result-icon hotel-result-icon"><Hotel size={19} /></span><div><p className="eyebrow">SOMEWHERE TO STAY</p><h3>Accommodation research</h3></div></div>
                    <p className="source-disclosure">These are web-search references from Tavily, not verified bookings. Live availability, nightly rates, amenities and property photos are not provided by the current integration.</p>
                    {result.hotels?.length ? (
                      <div className="stay-results">
                        {result.hotels.map((stay, index) => (
                          <article className="stay-result" key={`${stay.name}-${index}`}>
                            <span className="stay-index">{String(index + 1).padStart(2, '0')}</span>
                            <div><h4>{stay.name}</h4><p>{stay.description || 'No additional description was returned by the source.'}</p><span className="stay-meta">Nightly rate and availability unavailable</span></div>
                            {stay.url && <a aria-label={`Open source for ${stay.name}`} className="source-link" href={stay.url} rel="noreferrer" target="_blank">Source <ExternalLink size={14} /></a>}
                          </article>
                        ))}
                      </div>
                    ) : <p className="empty-state">The connected search returned no accommodation references.</p>}
                  </section>
                )}

                {(activeOption === 'itinerary' || activeOption === 'complete') && (
                  <section className="result-block itinerary-result-block">
                    <div className="result-block-heading"><span className="result-icon itinerary-result-icon"><FileText size={19} /></span><div><p className="eyebrow">YOUR DAYS, THOUGHTFULLY PLANNED</p><h3>Day-by-day itinerary</h3></div></div>
                    {result.itinerary ? (
                      <div className="day-grid">
                        {itineraryDays.map((day, index) => (
                          <article className="day-card" key={`${day.title}-${index}`}>
                            <span className="day-number">{String(index + 1).padStart(2, '0')}</span>
                            <div><h4>{day.title}</h4><MarkdownContent>{day.content}</MarkdownContent></div>
                          </article>
                        ))}
                      </div>
                    ) : <p className="empty-state">The itinerary agent did not return day-by-day details.</p>}
                    <p className="estimate-note"><Sparkles size={14} /> Activities and expenses in the itinerary are AI-generated estimates, not confirmed prices.</p>
                  </section>
                )}

                {activeOption === 'complete' && (
                  <>
                    {result.complete_plan && (
                      <section className="integrated-summary">
                        <div className="result-block-heading"><span className="result-icon itinerary-result-icon"><Sparkles size={19} /></span><div><p className="eyebrow">LANGGRAPH COMPLETE-PLAN AGENT</p><h3>Your trip, brought together</h3></div></div>
                        <MarkdownContent>{result.complete_plan}</MarkdownContent>
                      </section>
                    )}
                    <section className="budget-summary">
                      <div><p className="eyebrow">A CLEAR-EYED BUDGET VIEW</p><h3>What we know — and what we don’t</h3></div>
                      <div className="budget-lines">
                        <div><span>Your budget target</span><strong>{currency(Number(form.budget))} USD</strong></div>
                        <div><span>Flight fares</span><strong>Not supplied by Aviationstack</strong></div>
                        <div><span>Accommodation rates</span><strong>Not supplied by web search</strong></div>
                        <div><span>Activities & meals</span><strong>See AI estimates in the itinerary</strong></div>
                      </div>
                      <p>No live total is available from the connected sources. The budget above is your target, not a quote or a sum of confirmed costs.</p>
                    </section>
                  </>
                )}
              </section>
            )}
          </section>
        )}

        {page === 'plan' && !selectedDestination && (
          <section className="empty-page page-wrap"><h1>Choose your destination first.</h1><button className="primary-button" onClick={() => navigate('explore')} type="button">Explore places <ArrowRight size={17} /></button></section>
        )}

        {page === 'trips' && (
          <section className="interior-page page-wrap">
            <p className="eyebrow">YOUR TRAVEL NOTEBOOK</p><h1>My trips</h1><p className="interior-lede">Complete plans you’ve made on this device, ready when you are.</p>
            {savedTrips.length ? (
              <div className="saved-trip-grid">
                {savedTrips.map((trip) => (
                  <button className="saved-trip-card" key={trip.id} onClick={() => openSavedTrip(trip)} type="button">
                    <TravelImage alt={`${trip.destination?.label || trip.form.destinationCity} scenery`} className="saved-trip-image" fallback={trip.destination?.fallback || destinations[0].fallback} src={trip.destination?.image || destinations[0].image} />
                    <span className="saved-trip-body"><span className="eyebrow">{displayDate(trip.form.departureDate)} – {displayDate(trip.form.returnDate)}</span><strong>{trip.form.destinationCity}, {trip.form.destinationCountry}</strong><span>{trip.form.travellers} travellers · {currency(Number(trip.form.budget))} USD target</span><span className="saved-trip-open">Open trip <ArrowUpRight size={15} /></span></span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-trips"><span><Bookmark size={22} /></span><h2>Your travel notebook is waiting.</h2><p>Build a complete trip plan and it will be saved here on this device.</p><button className="primary-button" onClick={() => navigate('explore')} type="button">Find somewhere to go <ArrowRight size={17} /></button></div>
            )}
          </section>
        )}

        {page === 'about' && (
          <section className="interior-page about-page page-wrap">
            <p className="eyebrow">A MORE THOUGHTFUL WAY TO PLAN</p><h1>About Elsewhere</h1><p className="interior-lede">A travel-planning workspace powered by your existing LangGraph agents.</p>
            <div className="about-grid">
              <article><span><Plane size={21} /></span><h2>Focused when you need it</h2><p>Request flight research, accommodation references, an itinerary, or the integrated workflow. Individual options call only the corresponding existing agent.</p></article>
              <article><span><Globe size={21} /></span><h2>Clear about its sources</h2><p>Flight records and web-search references are labeled honestly. Missing fares, availability and other details are never presented as live facts.</p></article>
              <article><span><Bookmark size={21} /></span><h2>Yours to come back to</h2><p>Your trip details and completed plans are stored in this browser. API credentials remain on the backend.</p></article>
            </div>
            <button className="primary-button" onClick={() => navigate('explore')} type="button">Explore destinations <ArrowRight size={17} /></button>
          </section>
        )}
      </main>

      <footer className="site-footer">
        <div className="page-wrap footer-inner"><button className="brand footer-brand" onClick={() => navigate('explore')} type="button"><span className="brand-mark"><Compass size={18} /></span><span>elsewhere<span>.</span></span></button><span>Go thoughtfully. Come back with stories.</span><button className="footer-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} type="button">BACK TO TOP ↑</button></div>
      </footer>
    </div>
  );
}

export default App;
