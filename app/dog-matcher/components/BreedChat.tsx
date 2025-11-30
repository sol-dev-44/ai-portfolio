'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Send, Loader2, Dog, RefreshCw, Search, X, Sparkles } from 'lucide-react';

// Helper to format chat messages with actions in italics
function formatChatMessage(text: string) {
    // Split by asterisk-wrapped actions like *wags tail*
    const parts = text.split(/(\*[^*]+\*)/g);

    return parts.map((part, i) => {
        if (part.startsWith('*') && part.endsWith('*')) {
            // Action text - render in italics with different color
            const action = part.slice(1, -1);
            return (
                <em key={i} className="text-pink-500 dark:text-pink-400 not-italic">
                    *{action}*
                </em>
            );
        }
        return <span key={i}>{part}</span>;
    });
}

type Breed = {
    breed_id: string;
    name: string;
    description: string;
    size_category: string;
    breed_group: string;
    energy_level: string;
    temperament: string[];
    image_urls: string[];
    trainability: string;
    apartment_friendly: boolean | null;
    good_with_kids: boolean | null;
};

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

type BreedChatProps = {
    initialBreedId: string | null;
    onClearBreed: () => void;
};

export default function BreedChat({ initialBreedId, onClearBreed }: BreedChatProps) {
    const [allBreeds, setAllBreeds] = useState<Breed[]>([]);
    const [selectedBreed, setSelectedBreed] = useState<Breed | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingBreeds, setLoadingBreeds] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showBreedSelector, setShowBreedSelector] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch all breeds on mount
    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/dog-matcher/breeds`)
            .then(res => res.json())
            .then(data => {
                const breeds = data.breeds || [];
                setAllBreeds(breeds);
                setLoadingBreeds(false);

                // If initialBreedId provided, select that breed
                if (initialBreedId) {
                    const breed = breeds.find((b: Breed) => b.breed_id === initialBreedId);
                    if (breed) {
                        selectBreed(breed);
                    }
                }
            })
            .catch(err => {
                console.error('Error fetching breeds:', err);
                setLoadingBreeds(false);
            });
    }, [initialBreedId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const selectBreed = (breed: Breed) => {
        setSelectedBreed(breed);
        setShowBreedSelector(false);
        setMessages([]);

        // Generate initial greeting based on breed personality
        const greeting = generateBreedGreeting(breed);
        setMessages([{ role: 'assistant', content: greeting }]);
    };

    const generateBreedGreeting = (breed: Breed): string => {
        const temperaments = breed.temperament || [];
        const energy = breed.energy_level?.toLowerCase() || 'medium';
        const size = breed.size_category?.toLowerCase() || 'medium';

        let greeting = `*wags tail excitedly* `;

        if (temperaments.includes('Friendly') || temperaments.includes('Playful')) {
            greeting += `Oh WOW, a new friend! Hi there! I'm a ${breed.name}! `;
        } else if (temperaments.includes('Protective') || temperaments.includes('Loyal')) {
            greeting += `*stands alert* Greetings, human. I am a ${breed.name}. I'll be watching over you. `;
        } else if (temperaments.includes('Independent')) {
            greeting += `*looks up casually* Oh, hello. I'm a ${breed.name}. I was just doing my own thing, but I suppose we can chat. `;
        } else if (temperaments.includes('Gentle')) {
            greeting += `*approaches softly* Hello, dear friend. I'm a ${breed.name}. It's lovely to meet you. `;
        } else {
            greeting += `Hi there! I'm a ${breed.name}! Nice to meet you! `;
        }

        if (energy === 'high' || energy === 'very high') {
            greeting += `I have SO much energy - want to play? Or run? Or maybe chase something?! 🎾`;
        } else if (energy === 'low') {
            greeting += `I'm pretty chill - how about we just relax and have a nice conversation? 😌`;
        } else {
            greeting += `What would you like to talk about? I'm all ears! 🐕`;
        }

        return greeting;
    };

    const handleSendMessage = async () => {
        if (!input.trim() || !selectedBreed || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const response = await fetch('/api/breed-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    breed: selectedBreed,
                    messages: [...messages, { role: 'user', content: userMessage }],
                    userMessage
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (err) {
            console.error('Error:', err);
            // Fallback response based on breed personality
            const fallbackResponse = generateFallbackResponse(selectedBreed, userMessage);
            setMessages(prev => [...prev, { role: 'assistant', content: fallbackResponse }]);
        } finally {
            setLoading(false);
        }
    };

    const generateFallbackResponse = (breed: Breed, userMessage: string): string => {
        const temperaments = breed.temperament || [];
        const energy = breed.energy_level?.toLowerCase() || 'medium';
        const msg = userMessage.toLowerCase();

        // Check for common topics
        if (msg.includes('walk') || msg.includes('outside') || msg.includes('park')) {
            if (energy === 'high' || energy === 'very high') {
                return `*jumps up excitedly* DID YOU SAY WALK?! YES YES YES! I LOVE walks! Let's go RIGHT NOW! 🏃‍♂️`;
            } else {
                return `*perks up ears* A walk sounds nice! I do enjoy a good stroll at my own pace. 🚶`;
            }
        }

        if (msg.includes('food') || msg.includes('treat') || msg.includes('eat') || msg.includes('hungry')) {
            return `*ears perk up immediately* Did someone say... TREATS?! 🦴 I'm always ready for snacks! A ${breed.name} never says no to food!`;
        }

        if (msg.includes('play') || msg.includes('ball') || msg.includes('toy') || msg.includes('fetch')) {
            if (energy === 'high' || energy === 'very high') {
                return `*grabs nearest toy* PLAYTIME! That's my FAVORITE time! Let's go let's go let's go! 🎾`;
            } else if (temperaments.includes('Independent')) {
                return `*looks at toy* Hmm, I might be interested... if I feel like it. Let me think about it. 🤔`;
            } else {
                return `*wags tail* Playing sounds fun! I'm always up for some gentle playtime with my favorite human! 🐾`;
            }
        }

        if (msg.includes('good') && (msg.includes('dog') || msg.includes('boy') || msg.includes('girl'))) {
            return `*tail wagging intensifies* I AM?! I'm a good ${breed.name}?! That's the BEST thing anyone has ever said to me! 🥹💕`;
        }

        if (msg.includes('love') || msg.includes('cute') || msg.includes('adorable')) {
            if (temperaments.includes('Friendly') || temperaments.includes('Loyal')) {
                return `*nuzzles happily* Aww, I love you too, human! ${breed.name}s are known for being loyal companions! You're stuck with me now! 💕`;
            } else {
                return `*looks away bashfully* Well, I... I suppose you're not too bad yourself, human. *secretly happy* 😊`;
            }
        }

        if (msg.includes('sleep') || msg.includes('tired') || msg.includes('nap') || msg.includes('rest')) {
            if (energy === 'low') {
                return `*yawns* Oh yes, napping is my specialty! As a ${breed.name}, I've mastered the art of the perfect nap. Join me? 😴`;
            } else {
                return `Sleep? But there's so much to DO! ...okay fine, maybe a quick power nap. But then we play! 💤`;
            }
        }

        // Default responses based on temperament
        if (temperaments.includes('Intelligent')) {
            return `*tilts head thoughtfully* Interesting question! As a ${breed.name}, I pride myself on being quite clever. Let me think about that... 🧠`;
        } else if (temperaments.includes('Playful')) {
            return `*bounces around* That's fun to think about! Hey, you know what else is fun? Everything! Life is great! 🎉`;
        } else if (temperaments.includes('Protective')) {
            return `*stays alert* I hear you, human. Know that as your ${breed.name}, I'll always keep you safe while we figure this out. 🛡️`;
        } else {
            return `*wags tail* I love chatting with you! As a ${breed.name}, I'm just happy to be here with my favorite human! 🐕`;
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const filteredBreeds = allBreeds.filter(breed =>
        breed.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const resetChat = () => {
        setSelectedBreed(null);
        setMessages([]);
        onClearBreed();
    };

    if (loadingBreeds) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading breeds...</p>
                </div>
            </div>
        );
    }

    // Breed selection screen
    if (!selectedBreed) {
        return (
            <div className="w-full max-w-4xl mx-auto px-4">
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full mb-4 shadow-xl"
                    >
                        <Dog className="w-10 h-10 text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                        Chat with a Dog Breed
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Select a breed to start chatting with their unique personality!
                    </p>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for a breed..."
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none"
                    />
                </div>

                {/* Breed Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto">
                    {filteredBreeds.map((breed) => {
                        const imageUrl = breed.image_urls?.[0];

                        return (
                            <motion.button
                                key={breed.breed_id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => selectBreed(breed)}
                                className="group p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-pink-500 hover:shadow-lg transition-all text-left"
                            >
                                <div className="relative w-full h-24 rounded-lg overflow-hidden mb-2">
                                    {imageUrl ? (
                                        <Image src={imageUrl} alt={breed.name} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-pink-400 to-rose-600 flex items-center justify-center">
                                            <span className="text-2xl font-bold text-white">
                                                {breed.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate group-hover:text-pink-600">
                                    {breed.name}
                                </h3>
                                <p className="text-xs text-gray-500 truncate">
                                    {breed.temperament?.slice(0, 2).join(', ') || breed.size_category}
                                </p>
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Chat interface
    return (
        <div className="w-full max-w-3xl mx-auto px-4">
            {/* Chat Header */}
            <div className="bg-white dark:bg-gray-800 rounded-t-2xl border border-b-0 border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-pink-500">
                            {selectedBreed.image_urls?.[0] ? (
                                <Image
                                    src={selectedBreed.image_urls[0]}
                                    alt={selectedBreed.name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-pink-400 to-rose-600 flex items-center justify-center">
                                    <Dog className="w-6 h-6 text-white" />
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 dark:text-white">{selectedBreed.name}</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {selectedBreed.temperament?.slice(0, 2).join(', ') || 'Online'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowBreedSelector(true)}
                            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Change breed"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                        <button
                            onClick={resetChat}
                            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Close chat"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="bg-gradient-to-b from-pink-50 to-rose-50 dark:from-gray-900 dark:to-gray-900 h-[50vh] overflow-y-auto p-4 space-y-4 border-x border-gray-200 dark:border-gray-700">
                {messages.map((msg, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[80%] ${msg.role === 'user'
                                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-2xl rounded-tr-sm'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl rounded-tl-sm shadow-md'
                            } px-4 py-3`}>
                            {msg.role === 'assistant' && (
                                <div className="flex items-center gap-2 mb-1 pb-1 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-sm font-semibold text-pink-600">{selectedBreed.name}</span>
                                    <Sparkles className="w-3 h-3 text-pink-400" />
                                </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{formatChatMessage(msg.content)}</p>
                        </div>
                    </motion.div>
                ))}

                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                    >
                        <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-md">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-pink-600">{selectedBreed.name}</span>
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white dark:bg-gray-800 rounded-b-2xl border border-t-0 border-gray-200 dark:border-gray-700 p-4">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={`Say something to ${selectedBreed.name}...`}
                        className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-900 border-0 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-gray-900 dark:text-white"
                        disabled={loading}
                    />
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSendMessage}
                        disabled={!input.trim() || loading}
                        className="px-5 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </motion.button>
                </div>

                {/* Quick responses */}
                <div className="flex flex-wrap gap-2 mt-3">
                    {['Good dog! 🐕', 'Want to play?', 'Who\'s a good boy?', 'Tell me about yourself'].map((quick) => (
                        <button
                            key={quick}
                            onClick={() => setInput(quick)}
                            className="px-3 py-1.5 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded-full text-xs font-medium hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors"
                        >
                            {quick}
                        </button>
                    ))}
                </div>
            </div>

            {/* Breed Selector Modal */}
            <AnimatePresence>
                {showBreedSelector && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowBreedSelector(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Choose a breed to chat with</h3>
                                <button
                                    onClick={() => setShowBreedSelector(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search breeds..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-900 rounded-lg outline-none focus:ring-2 focus:ring-pink-500"
                                />
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto">
                                {filteredBreeds.map((breed) => (
                                    <button
                                        key={breed.breed_id}
                                        onClick={() => selectBreed(breed)}
                                        className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors text-left"
                                    >
                                        <div className="relative w-full h-16 rounded-lg overflow-hidden mb-1">
                                            {breed.image_urls?.[0] ? (
                                                <Image src={breed.image_urls[0]} alt={breed.name} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-pink-400 to-rose-600 flex items-center justify-center">
                                                    <span className="text-lg font-bold text-white">
                                                        {breed.name[0]}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                            {breed.name}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}