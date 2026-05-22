/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ChefHat, 
  BookOpen, 
  Upload, 
  Plus, 
  Search, 
  Sparkles, 
  ExternalLink, 
  Trash2, 
  Layers, 
  UtensilsCrossed, 
  FileCode, 
  AlertCircle, 
  Check, 
  X, 
  Heart,
  HelpCircle,
  Clock,
  ChevronRight,
  RefreshCw,
  Salad,
  FlameKindling
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Recipe, RecipeCategory, RecipeBase } from './types';
import { PRELOADED_RECIPES } from './data/preloadedRecipes';

export default function App() {
  // Recipes State loaded from localStorage, falling back to PRELOADED_RECIPES
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('recipe_bookmarks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load saved recipes', e);
      }
    }
    return PRELOADED_RECIPES;
  });

  // Save recipes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('recipe_bookmarks', JSON.stringify(recipes));
  }, [recipes]);

  // Frontend UI states
  const [activeCategory, setActiveCategory] = useState<RecipeCategory>('appetizer');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('recipe_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // Track favorited recipes in localStorage
  useEffect(() => {
    localStorage.setItem('recipe_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Manual Add Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualCategory, setManualCategory] = useState<RecipeCategory>('main');
  const [manualBase, setManualBase] = useState<RecipeBase>('vegetable');
  const [manualSubCategory, setManualSubCategory] = useState('');
  const [categorizerMode, setCategorizerMode] = useState<'hybrid' | 'local'>('hybrid');
  const [hadFallbackWarning, setHadFallbackWarning] = useState<boolean>(false);

  // Local Culinary Heuristic Sorting Engine (Instant & offline-first)
  const localHeuristicCategorize = (items: { title: string; url: string }[]): Recipe[] => {
    return items.map((recipe, idx) => {
      const titleLower = recipe.title.toLowerCase();
      
      // 1. Base Class: meat/seafood vs vegetable/green
      const meatKeywords = [
        'chicken', 'poultry', 'turkey', 'duck', 'hen', 'fowl',
        'beef', 'steak', 'ribeye', 'sirloin', 'burger', 'marrow', 'veal',
        'pork', 'bacon', 'ham', 'sausage', 'prosciutto', 'salami', 'lard', 'pepperoni', 'pancetta',
        'lamb', 'mutton', 'goat', 'venison',
        'salmon', 'shrimp', 'prawn', 'trout', 'cod', 'halibut', 'tuna', 'crab', 'lobster', 
        'mussel', 'clam', 'oyster', 'scallop', 'seafood', 'fish', 'anchovy', 'sardine', 'calamari', 'squid'
      ];
      
      let base: RecipeBase = 'vegetable';
      let matchedMeatKey = '';
      for (const key of meatKeywords) {
        if (titleLower.includes(key)) {
          base = 'meat';
          matchedMeatKey = key;
          break;
        }
      }
      
      // 2. Category Sort: appetiser, soups, entree, main, desert
      let category: RecipeCategory = 'main';
      
      const desertKeywords = [
        'desert', 'dessert', 'cake', 'cookie', 'chocolate', 'pie', 'tart', 'sweet', 'pudding', 
        'donut', 'cupcake', 'brownie', 'muffin', 'ice cream', 'sorbet', 'lava cake', 'parfait',
        'pancake', 'waffle', 'crepe', 'mousse', 'cheesecake', 'crumble', 'cobbler', 'custard'
      ];
      const soupKeywords = [
        'soup', 'soupky', 'broth', 'chowder', 'bisque', 'ramen', 'pho', 'stew', 'gumbo', 'bouillabaisse', 'lentil'
      ];
      const appetizerKeywords = [
        'appetizer', 'starter', 'bruschetta', 'bite', 'skewer', 'dip', 'nachos', 'crostini', 
        'wings', 'meatball', 'fritter', 'deviled', 'caprese', 'spring roll', 
        'egg roll', 'potsticker', 'dumpling', 'guacamole', 'salsa', 'hummus', 'canape', 'tapas'
      ];
      const entreeKeywords = [
        'entree', 'salad', 'caesar', 'quiche', 'risotto', 'cannelloni', 'antipasto', 
        'carpaccio', 'tartare', 'flatbread'
      ];

      if (desertKeywords.some(key => titleLower.includes(key))) {
        category = 'desert';
      } else if (soupKeywords.some(key => titleLower.includes(key))) {
        category = 'soups';
      } else if (appetizerKeywords.some(key => titleLower.includes(key))) {
        category = 'appetizer';
      } else if (entreeKeywords.some(key => titleLower.includes(key))) {
        category = 'entree';
      } else {
        category = 'main';
      }
      
      // 3. SubCategory Sub-Groupings
      let subCategory = '';
      if (base === 'meat' && matchedMeatKey) {
        subCategory = matchedMeatKey.charAt(0).toUpperCase() + matchedMeatKey.slice(1);
        if (['steak', 'ribeye', 'sirloin', 'burger', 'marrow', 'veal'].includes(matchedMeatKey)) {
          subCategory = 'Beef';
        } else if (['turkey', 'duck', 'hen', 'fowl'].includes(matchedMeatKey)) {
          subCategory = 'Poultry';
        } else if (['bacon', 'ham', 'sausage', 'prosciutto', 'salami', 'pepperoni', 'pancetta'].includes(matchedMeatKey)) {
          subCategory = 'Pork';
        } else if (['shrimp', 'prawn', 'salmon', 'trout', 'cod', 'halibut', 'tuna', 'crab', 'lobster', 'mussel', 'clam', 'oyster', 'scallop', 'seafood', 'fish', 'anchovy', 'sardine', 'calamari', 'squid'].includes(matchedMeatKey)) {
          subCategory = 'Seafood';
        }
      } else {
        const vegKeywords = [
          'brocoli', 'broccoli', 'potato', 'mushroom', 'tomato', 'chocolate', 'apple', 'spinach', 
          'eggplant', 'aubergine', 'cheese', 'strawberry', 'garlic', 'parmesan', 'cauliflower', 
          'carrot', 'onion', 'squash', 'pumpkin', 'avocado', 'lemon', 'lime', 'berry', 'blueberry', 
          'raspberry', 'banana', 'orange', 'coconut', 'caramel', 'vanilla', 'asparagus', 'rice', 'pasta'
        ];
        
        let matchedVeg = '';
        for (const veg of vegKeywords) {
          if (titleLower.includes(veg)) {
            matchedVeg = veg;
            break;
          }
        }
        
        if (matchedVeg) {
          subCategory = matchedVeg.charAt(0).toUpperCase() + matchedVeg.slice(1);
          if (subCategory === 'Aubergine') subCategory = 'Eggplant';
          if (subCategory === 'Brocoli') subCategory = 'Broccoli';
        } else {
          if (category === 'desert') {
            subCategory = 'Sweet Treats';
          } else if (category === 'soups') {
            subCategory = 'Broths & Stocks';
          } else {
            subCategory = 'Fresh Herbs & Greens';
          }
        }
      }

      return {
        id: `imported-local-${Date.now()}-${idx}`,
        title: recipe.title,
        url: recipe.url,
        category,
        base,
        subCategory,
        source: 'uploaded'
      };
    });
  };

  // AI Chef Companion State
  const [selectedRecipeForAI, setSelectedRecipeForAI] = useState<Recipe | null>(null);
  const [aiChefOverview, setAiChefOverview] = useState<string | null>(null);
  const [isAiChefLoading, setIsAiChefLoading] = useState(false);
  const [aiChefError, setAiChefError] = useState<string | null>(null);

  // Drag and Drop Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Categories helper list
  const categoryTabs: { key: RecipeCategory; label: string; icon: any }[] = [
    { key: 'appetizer', label: 'Appetizers', icon: Salad },
    { key: 'soups', label: 'Soups', icon: UtensilsCrossed },
    { key: 'entree', label: 'Entrees', icon: Layers },
    { key: 'main', label: 'Mains', icon: ChefHat },
    { key: 'desert', label: 'Desserts', icon: FlameKindling },
  ];

  // Robust culinary catalog image helper
  const getRecipeImage = (category: string, base: string, subCategory: string): string => {
    const s = (subCategory || '').toLowerCase();
    const c = (category || '').toLowerCase();
    
    if (s.includes('chicken') || s.includes('poultry')) {
      return 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&auto=format&fit=crop&q=80';
    }
    if (s.includes('beef') || s.includes('steak') || s.includes('ribeye')) {
      return 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80';
    }
    if (s.includes('pork') || s.includes('bacon') || s.includes('sausage') || s.includes('ham')) {
      return 'https://images.unsplash.com/photo-1524438418049-ab2acb7aa48f?w=400&auto=format&fit=crop&q=80';
    }
    if (s.includes('salmon') || s.includes('seafood') || s.includes('shrimp') || s.includes('fish') || s.includes('crab') || s.includes('prawn') || s.includes('lobster') || s.includes('tuna')) {
      return 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&auto=format&fit=crop&q=80';
    }
    if (s.includes('lamb') || s.includes('duck')) {
      return 'https://images.unsplash.com/photo-1514516369-197ac21e0cd2?w=400&auto=format&fit=crop&q=80';
    }
    if (s.includes('broccoli') || s.includes('cauliflower') || s.includes('brussels')) {
      return 'https://images.unsplash.com/photo-1583745025064-07d27e040fb6?w=400&auto=format&fit=crop&q=80';
    }
    if (s.includes('potato')) {
      return 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&auto=format&fit=crop&q=80';
    }
    if (s.includes('mushroom')) {
      return 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&auto=format&fit=crop&q=80';
    }
    if (s.includes('tomato') || s.includes('sandwich') || s.includes('bruschetta')) {
      return 'https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=400&auto=format&fit=crop&q=80';
    }
    if (s.includes('chocolate') || s.includes('lava cake') || s.includes('desert') || s.includes('sweet') || s.includes('cake')) {
      return 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&auto=format&fit=crop&q=80';
    }
    if (s.includes('apple') || s.includes('strawberry') || s.includes('fruit') || s.includes('berry') || s.includes('parfait')) {
      return 'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=400&auto=format&fit=crop&q=80';
    }
    if (s.includes('spinach') || s.includes('eggplant') || s.includes('salad') || s.includes('greens') || base === 'vegetable') {
      if (c === 'desert') {
        return 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&auto=format&fit=crop&q=80';
      }
      return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80';
    }

    // fallback category banners
    if (c === 'desert' || c === 'desert') {
      return 'https://images.unsplash.com/photo-149514740007a-f8a53e30b22d?w=400&auto=format&fit=crop&q=80';
    }
    if (c === 'soups') {
      return 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&auto=format&fit=crop&q=80';
    }
    if (c === 'appetizer') {
      return 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=400&auto=format&fit=crop&q=80';
    }
    if (c === 'entree') {
      return 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&auto=format&fit=crop&q=80';
    }
    
    return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&auto=format&fit=crop&q=80';
  };

  // Helper function to extract domain name as source
  const getDomainName = (urlStr: string) => {
    try {
      if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
        urlStr = 'https://' + urlStr;
      }
      const u = new URL(urlStr);
      return u.hostname.replace('www.', '');
    } catch (e) {
      return 'Recipe Website';
    }
  };

  // Toggle Favorite
  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  // Reset recipes back to preloaded defaults
  const handleResetToDefaults = () => {
    if (confirm('Are you sure you want to reset your library to the curated defaults? This will erase imported links.')) {
      setRecipes(PRELOADED_RECIPES);
      setFavorites([]);
    }
  };

  // Delete a individual recipe
  const handleDeleteRecipe = (id: string) => {
    if (confirm('Delete this recipe bookmark?')) {
      setRecipes(prev => prev.filter(r => r.id !== id));
    }
  };

  // Trigger file parser
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Parse HTML File and classify using AI
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processHtmlFile(file);
  };

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle Drag Drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processHtmlFile(file);
    }
  };

  const processHtmlFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setHadFallbackWarning(false);
    setUploadProgress('Reading local HTML bookmark file...');

    try {
      const text = await file.text();
      // Browser DOM Parser to extract <a> tags safely
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const hrefElements = doc.querySelectorAll('a');
      
      const rawExtracted: { title: string; url: string }[] = [];
      hrefElements.forEach(el => {
        const url = el.getAttribute('href');
        const title = el.textContent?.trim() || '';
        if (url && title && (url.startsWith('http') || url.includes('.'))) {
          rawExtracted.push({ title, url });
        }
      });

      if (rawExtracted.length === 0) {
        throw new Error('No valid recipe links (<a> tags with hrefs) were found inside this HTML file. Please make sure the file contains exported HTML bookmarks.');
      }

      const parsedRecipes: Recipe[] = [];

      if (categorizerMode === 'local') {
        setUploadProgress(`Processing ${rawExtracted.length} recipe bookmarks locally...`);
        const result = localHeuristicCategorize(rawExtracted);
        parsedRecipes.push(...result);
      } else {
        setUploadProgress(`Found ${rawExtracted.length} recipe bookmarks. Initializing Gemini AI to auto-classify categories, bases, and main ingredients...`);

        // We will batch categorizations in groups of 12 to prevent exceeding API rate limits
        const chunkSize = 12;
        let apiQuotaExceeded = false;

        for (let i = 0; i < rawExtracted.length; i += chunkSize) {
          const chunk = rawExtracted.slice(i, i + chunkSize);
          
          if (apiQuotaExceeded) {
            // Quietly parse remaining chunk locally
            const result = localHeuristicCategorize(chunk);
            parsedRecipes.push(...result);
            continue;
          }

          setUploadProgress(`Requesting AI recipe categorization: Batch ${Math.floor(i / chunkSize) + 1} of ${Math.ceil(rawExtracted.length / chunkSize)}...`);

          try {
            const response = await fetch('/api/categorize-recipes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ recipes: chunk }),
            });

            if (!response.ok) {
              const errData = await response.json();
              console.warn("AI Categorizer returned error, falling back to local heuristics:", errData);
              apiQuotaExceeded = true;
              setHadFallbackWarning(true);
              // Parse this chunk locally instead
              const result = localHeuristicCategorize(chunk);
              parsedRecipes.push(...result);
              continue;
            }

            const data = await response.json();
            if (data.success && Array.isArray(data.recipes)) {
              data.recipes.forEach((item: any, idx: number) => {
                parsedRecipes.push({
                  id: `imported-${Date.now()}-${i + idx}`,
                  title: item.title || chunk[idx].title,
                  url: item.url || chunk[idx].url,
                  category: (item.category || 'main').toLowerCase() as RecipeCategory,
                  base: (item.base || 'vegetable').toLowerCase() as RecipeBase,
                  subCategory: item.subCategory || 'Other',
                  source: 'uploaded'
                });
              });
            } else {
              apiQuotaExceeded = true;
              setHadFallbackWarning(true);
              const result = localHeuristicCategorize(chunk);
              parsedRecipes.push(...result);
            }
          } catch (apiError) {
            console.warn("AI categorization request failed, falling back to local heuristics:", apiError);
            apiQuotaExceeded = true;
            setHadFallbackWarning(true);
            const result = localHeuristicCategorize(chunk);
            parsedRecipes.push(...result);
          }
        }
      }

      setRecipes(prev => {
        // Filter out duplicates based on URL
        const existingUrls = new Set(prev.map(r => r.url.toLowerCase().trim()));
        const uniqueNew = parsedRecipes.filter(r => !existingUrls.has(r.url.toLowerCase().trim()));
        return [...uniqueNew, ...prev];
      });

      setUploadProgress('');
      setIsUploading(false);

      if (parsedRecipes.some(r => r.id.includes('local')) && categorizerMode === 'hybrid') {
        alert(`Finished importing! Added ${parsedRecipes.length} new recipe bookmarks to your binder. Note: Some or all recipes were analyzed using high-speed local fallback heuristics because the Gemini API free-tier limits were exceeded.`);
      } else {
        alert(`Success! Seamlessly processed your recipe book. Added ${parsedRecipes.length} new categorized bookmarks to your digital binder!`);
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'An unexpected error occurred while parsing folder links.');
      setIsUploading(false);
    }
  };

  // Form Submission for manual Addition
  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualUrl) {
      alert('Please provide at least a recipe title and URL.');
      return;
    }

    const newRecipe: Recipe = {
      id: `manual-${Date.now()}`,
      title: manualTitle,
      url: manualUrl,
      category: manualCategory,
      base: manualBase,
      subCategory: manualSubCategory.trim() || (manualBase === 'meat' ? 'Other Meat' : 'Other Green'),
      source: 'uploaded'
    };

    setRecipes(prev => [newRecipe, ...prev]);
    setIsManualModalOpen(false);
    
    // Reset form fields
    setManualTitle('');
    setManualUrl('');
    setManualSubCategory('');
    
    alert('Recipe added manually to your card collection!');
  };

  // Fetch Chef AI Overview
  const fetchRecipeChefDetails = async (recipe: Recipe) => {
    setSelectedRecipeForAI(recipe);
    setIsAiChefLoading(true);
    setAiChefOverview(null);
    setAiChefError(null);

    try {
      const res = await fetch('/api/recipe-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: recipe.title,
          url: recipe.url
        }),
      });

      if (!res.ok) {
        throw new Error('Could not formulate chef review response.');
      }

      const data = await res.json();
      if (data.success && data.overview) {
        setAiChefOverview(data.overview);
      } else {
        throw new Error('Empty response received from Chef bot.');
      }
    } catch (err: any) {
      console.error(err);
      setAiChefError(err.message || 'Failed to reach helper chef. Ensure your Gemini API is running.');
    } finally {
      setIsAiChefLoading(false);
    }
  };

  // Format category name for active display
  const getCategoryLabel = (cat: RecipeCategory) => {
    switch (cat) {
      case 'appetizer': return 'Appetizer Bar';
      case 'soups': return 'Soups & Kettle';
      case 'entree': return 'Entree Delicacies';
      case 'main': return 'Main Courses';
      case 'desert': return 'Dessert Buffet';
      default: return cat;
    }
  };

  // Filters: category match + search query filter (searches title, domain, subCategory)
  const filteredRecipes = recipes.filter(recipe => {
    const isCategoryMatch = recipe.category === activeCategory;
    const isSearchMatch = searchQuery === '' || 
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.subCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getDomainName(recipe.url).toLowerCase().includes(searchQuery.toLowerCase());
    return isCategoryMatch && isSearchMatch;
  });

  // Split active recipes into Vegetable vs. Meat
  const vegRecipes = filteredRecipes.filter(r => r.base === 'vegetable');
  const meatRecipes = filteredRecipes.filter(r => r.base === 'meat');

  // Helper to group recipes under a base by subCategory
  const groupRecipesBySubCategory = (list: Recipe[]) => {
    const grouped: { [key: string]: Recipe[] } = {};
    list.forEach(r => {
      const sub = r.subCategory || 'Other';
      if (!grouped[sub]) {
        grouped[sub] = [];
      }
      grouped[sub].push(r);
    });
    return grouped;
  };

  const vegGrouped = groupRecipesBySubCategory(vegRecipes);
  const meatGrouped = groupRecipesBySubCategory(meatRecipes);

  // Counters for side badge updates
  const countByCategoryAndType = (cat: RecipeCategory, base: RecipeBase) => {
    return recipes.filter(r => r.category === cat && r.base === base).length;
  };

  return (
    <div className="min-h-screen text-slate-800 flex flex-col font-sans select-none selection:bg-brand-200">
      
      {/* HEADER HERO */}
      <header className="bg-gradient-to-r from-amber-50 via-amber-50/90 to-orange-50/40 border-b border-brand-200 py-10 px-6 relative overflow-hidden">
        {/* Editorial culinary backdrop on the far right */}
         <div 
          className="absolute inset-y-0 right-0 w-full md:w-3/5 bg-cover bg-center pointer-events-none opacity-30 mix-blend-multiply"
          style={{ 
            backgroundImage: "url('/src/assets/images/gourmet_hero_1779420968959.png')",
            maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)'
          }}
        />
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-brand-600 text-white rounded-xl shadow-md mt-1 animate-pulse">
              <ChefHat size={32} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight text-brand-950 flex items-center gap-2">
                L'Atelier Gourmet <span className="text-xs font-sans font-bold uppercase tracking-widest px-3 py-1 bg-brand-600 text-white rounded-full shadow-xs">Binder</span>
              </h1>
              <p className="text-slate-700 text-sm mt-1.5 max-w-xl font-medium leading-relaxed">
                A gorgeous smart recipe organizer. Import bookmark files (<code className="font-mono text-amber-800 font-extrabold">recepies_href.html</code>) directly and let Gemini AI magically categorize them.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {/* Reset Defaults */}
            <button 
              onClick={handleResetToDefaults}
              className="px-4 py-2 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg flex items-center gap-2 transition duration-150 active:scale-95"
              title="Reset lists to the preset chef curated recipes"
            >
              <RefreshCw size={14} />
              Reset Library
            </button>

            {/* Manual ADD Trigger */}
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-brand-800 bg-white hover:bg-brand-100 border border-brand-200 shadow-xs rounded-lg flex items-center gap-2 transition duration-150 active:scale-95"
            >
              <Plus size={15} />
              Add Manual Link
            </button>

            {/* File Uploader Input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".html,.txt" 
              className="hidden" 
            />
            
            <button 
              onClick={triggerFileInput}
              className="px-5 py-2.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition duration-200 active:scale-100 active:translate-y-0.5"
            >
              <Upload size={14} className="animate-bounce" />
              Upload recepies_href.html
            </button>
          </div>
        </div>
      </header>

      {/* CORE WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SIDE BAR / SEARCH & ACTIONS */}
        <section className="lg:col-span-3 flex flex-col gap-5">
          
          {/* SEARCH COMPONENT */}
          <div className="bg-white p-4 rounded-xl border border-brand-200 shadow-sm flex flex-col gap-3">
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-2">
              <Search size={12} /> Search Recipes
            </h3>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ingredients, sites..."
                className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            
            <div className="text-xxs text-slate-400 font-medium">
              Filter with keywords like "Chicken", "Tomato", "Salmon", or website names.
            </div>
          </div>

          {/* IMPORT SETTINGS / CATEGORIZER MODE */}
          <div className="bg-white p-4 rounded-xl border border-brand-200 shadow-sm flex flex-col gap-3">
            <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider flex items-center gap-2">
              <Layers size={12} className="text-brand-600" /> Categorizer Engine
            </h3>
            
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
              <button
                type="button"
                onClick={() => setCategorizerMode('hybrid')}
                className={`py-2 px-1 rounded-md transition duration-150 flex flex-col items-center justify-center gap-0.5 cursor-pointer
                  ${categorizerMode === 'hybrid' 
                    ? 'bg-brand-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
              >
                <div className="flex items-center gap-1 font-bold text-[10px]">
                  <Sparkles size={11} className={categorizerMode === 'hybrid' ? 'text-yellow-200' : 'text-slate-400'} />
                  Smart AI
                </div>
                <span className="text-[8px] opacity-80">(Local Fallback)</span>
              </button>

              <button
                type="button"
                onClick={() => setCategorizerMode('local')}
                className={`py-2 px-1 rounded-md transition duration-150 flex flex-col items-center justify-center gap-0.5 cursor-pointer
                  ${categorizerMode === 'local' 
                    ? 'bg-brand-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
              >
                <div className="flex items-center gap-1 font-bold text-[10px]">
                  <Clock size={11} className={categorizerMode === 'local' ? 'text-yellow-200' : 'text-slate-400'} />
                  Heuristic
                </div>
                <span className="text-[8px] opacity-80">(Instant, Free)</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed">
              {categorizerMode === 'hybrid' ? (
                <span><strong>Optimized Strategy</strong>: Calls Gemini. If your 20-request free quota is temporarily exhausted, it automatically falls back to local heuristics instantly.</span>
              ) : (
                <span><strong>Pure Offline Strategy</strong>: Scans and sorts ingredients directly in the browser in seconds. Guaranteed 0% quota usage, 100% free.</span>
              )}
            </p>
          </div>

          {/* DOCK FILE DRAG & DROP AREA */}
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`cursor-pointer p-5 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center gap-3 transition duration-200 bg-white
              ${isUploading ? 'border-brand-500 bg-amber-50/50' : 'border-brand-200 hover:border-brand-500 hover:bg-amber-50/20'}`}
          >
            <div className={`p-3 rounded-full ${isUploading ? 'bg-amber-200 text-amber-700 animate-spin' : 'bg-brand-100 text-brand-700'}`}>
              {isUploading ? <RefreshCw size={20} /> : <FileCode size={20} />}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-700">Drag & Drop Local File</h4>
              <p className="text-xxs text-slate-400 mt-1 max-w-[210px] mx-auto">
                Drop your HTML file from <code className="font-mono text-amber-800">C:\mywebretete\recepies_href.html</code> here to parse instantly using local DOMParser + Gemini.
              </p>
            </div>
          </div>

          {/* SYSTEM MESSAGES IN-SIDEBAR */}
          {isUploading && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl animate-pulse">
              <div className="flex gap-2.5">
                <Sparkles className="text-brand-600 shrink-0 mt-0.5 animate-bounce" size={16} />
                <div>
                  <h4 className="text-xs font-bold text-brand-800">AI Sorting Room Live</h4>
                  <p className="text-[11px] text-slate-600 mt-1 font-mono leading-relaxed">{uploadProgress}</p>
                </div>
              </div>
            </div>
          )}

          {uploadError && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
              <div className="flex gap-2 text-red-800">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold">Import Failure</h4>
                  <p className="text-xxs text-red-700 mt-1 leading-relaxed">{uploadError}</p>
                  <button 
                    onClick={() => setUploadError(null)}
                    className="mt-2 text-[10px] font-bold underline cursor-pointer text-red-900"
                  >
                    Clear Warning
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PERSISTENT STATS */}
          <div className="bg-white p-4 rounded-xl border border-brand-200 shadow-sm">
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-2 mb-3">
              <Layers size={11} /> Binder Contents
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>Total Bookmarks Saved:</span>
                <span className="font-bold text-brand-900-foreground px-2 py-0.5 bg-slate-100 rounded-md">{recipes.length}</span>
              </div>
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>🥬 Vegetable Based:</span>
                <span className="font-bold text-green-700 px-2 py-0.5 bg-green-50 rounded-md">{recipes.filter(r => r.base === 'vegetable').length}</span>
              </div>
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>🥩 Meat / Seafood Based:</span>
                <span className="font-bold text-red-700 px-2 py-0.5 bg-red-50 rounded-md">{recipes.filter(r => r.base === 'meat').length}</span>
              </div>
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>💖 Favorite Links:</span>
                <span className="font-bold text-rose-700 px-2 py-0.5 bg-rose-50 rounded-md">{favorites.length}</span>
              </div>
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>📥 Custom Imports:</span>
                <span className="font-bold text-blue-700 px-2 py-0.5 bg-blue-50 rounded-md">{recipes.filter(r => r.source === 'uploaded').length}</span>
              </div>
            </div>
          </div>

        </section>

        {/* MAIN RECIPES DISPLAY */}
        <section className="lg:col-span-9 flex flex-col gap-6">

          {/* HORIZONTAL CATEGORY NAVIGATION */}
          <div className="bg-white p-1.5 rounded-xl border border-brand-200 shadow-xs flex flex-wrap gap-1 md:grid md:grid-cols-5">
            {categoryTabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeCategory === tab.key;
              const totalItems = recipes.filter(r => r.category === tab.key).length;
              const vegCount = countByCategoryAndType(tab.key, 'vegetable');
              const meatCount = countByCategoryAndType(tab.key, 'meat');
              
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveCategory(tab.key)}
                  className={`relative py-3.5 px-3 rounded-lg flex flex-col items-center justify-center gap-1.5 transition duration-200 cursor-pointer text-center
                    ${isActive 
                      ? 'bg-brand-600 text-white shadow-sm font-medium' 
                      : 'hover:bg-amber-50/60 text-slate-600 hover:text-slate-900 font-normal'}`}
                >
                  <IconComponent size={20} className={isActive ? 'text-white scale-110' : 'text-slate-400'} />
                  <span className="text-xs md:text-xs font-semibold tracking-wide whitespace-nowrap">{tab.label}</span>
                  
                  {/* Category mini statistics bubble */}
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono mt-0.5
                    ${isActive ? 'bg-brand-800 text-yellow-100' : 'bg-slate-100 text-slate-500'}`}>
                    {totalItems} <span className="text-[9px] opacity-70">({vegCount}v / {meatCount}m)</span>
                  </span>

                  {isActive && (
                    <motion.div 
                      layoutId="activeCategoryDot" 
                      className="absolute bottom-1 w-1.5 h-1.5 bg-white rounded-full" 
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* ACTIVE CABINET HEADER */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-200 pb-3">
            <div>
              <h2 className="text-xl md:text-2xl font-serif font-bold text-brand-900 flex items-center gap-2">
                <span>{getCategoryLabel(activeCategory)}</span>
                <span className="text-sm font-sans font-light text-slate-400">
                  ({filteredRecipes.length} match{filteredRecipes.length !== 1 && 'es'})
                </span>
              </h2>
            </div>
          </div>

          {/* CATEGORIZED DUAL VIEW GRID (VEGETABLES VS MEAT) */}
          {filteredRecipes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-brand-300 p-12 text-center flex flex-col items-center justify-center gap-4">
              <div className="p-4 bg-brand-100 rounded-full text-brand-700">
                <UtensilsCrossed size={40} />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-slate-800">No Recipe Bookmarks Here</h3>
                <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
                  We don't have any bookmarks listed under <strong className="text-brand-900">{getCategoryLabel(activeCategory)}</strong> matching your search query. 
                </p>
                <p className="text-xs text-brand-700 font-medium mt-1">
                  Upload your <code className="font-bold underline">recepies_href.html</code> or click "Add Manual Link" above!
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* LEFT COLUMN: VEGETABLE INGREDIENT BOUNDS */}
              <div className="flex flex-col gap-5">
                <div className="bg-green-50/50 p-3 rounded-xl border border-green-200/50 flex items-center justify-between">
                  <span className="text-xs font-bold text-green-800 uppercase tracking-widest flex items-center gap-2">
                    <span className="p-1 bg-green-100 text-green-700 rounded-md">🥬</span> Vegetables, Sweets & Greens
                  </span>
                  <span className="text-xs font-mono font-bold text-green-800 bg-green-100 px-2 py-0.5 rounded-full">
                    {vegRecipes.length} item{vegRecipes.length !== 1 && 's'}
                  </span>
                </div>

                {vegRecipes.length === 0 ? (
                  <div className="text-slate-400 text-xs italic p-6 text-center border border-dashed border-slate-200 rounded-xl bg-white/50">
                    No green/veg recipes sorted here yet.
                  </div>
                ) : (
                  Object.keys(vegGrouped).sort().map((subCategory) => (
                    <div key={subCategory} className="bg-white p-4 rounded-xl border border-brand-200/80 shadow-xs">
                      
                      {/* Sub-Category Badge Group Title */}
                      <h4 className="text-xs font-extrabold text-slate-500 border-b border-brand-100 pb-1.5 mb-3 uppercase tracking-wider flex items-center justify-between">
                        <span>🌱 Sorting Base: {subCategory}</span>
                        <span className="text-xxs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-mono normal-case">
                          {vegGrouped[subCategory].length} recipe{vegGrouped[subCategory].length !== 1 && 's'}
                        </span>
                      </h4>

                      {/* Card listing */}
                      <div className="grid grid-cols-1 gap-3">
                        {vegGrouped[subCategory].map((recipe) => (
                          <RecipeCard 
                            key={recipe.id}
                            recipe={recipe}
                            isFavorited={favorites.includes(recipe.id)}
                            onToggleFavorite={toggleFavorite}
                            onDelete={handleDeleteRecipe}
                            onChefConsult={fetchRecipeChefDetails}
                            domain={getDomainName(recipe.url)}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* RIGHT COLUMN: MEAT INGREDIENT BOUNDS */}
              <div className="flex flex-col gap-5">
                <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-200/50 flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-800 uppercase tracking-widest flex items-center gap-2">
                    <span className="p-1 bg-rose-100 text-rose-700 rounded-md">🥩</span> Savory Meats & Sea Food
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                    {meatRecipes.length} item{meatRecipes.length !== 1 && 's'}
                  </span>
                </div>

                {meatRecipes.length === 0 ? (
                  <div className="text-slate-400 text-xs italic p-6 text-center border border-dashed border-slate-200 rounded-xl bg-white/50">
                    No meat or seafood recipes sorted here yet.
                  </div>
                ) : (
                  Object.keys(meatGrouped).sort().map((subCategory) => (
                    <div key={subCategory} className="bg-white p-4 rounded-xl border border-brand-200/80 shadow-xs">
                      
                      {/* Sub-Category Badge Group Title */}
                      <h4 className="text-xs font-extrabold text-slate-500 border-b border-brand-100 pb-1.5 mb-3 uppercase tracking-wider flex items-center justify-between">
                        <span>🍖 Roast Base: {subCategory}</span>
                        <span className="text-xxs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-mono normal-case">
                          {meatGrouped[subCategory].length} recipe{meatGrouped[subCategory].length !== 1 && 's'}
                        </span>
                      </h4>

                      {/* Card listing */}
                      <div className="grid grid-cols-1 gap-3">
                        {meatGrouped[subCategory].map((recipe) => (
                          <RecipeCard 
                            key={recipe.id}
                            recipe={recipe}
                            isFavorited={favorites.includes(recipe.id)}
                            onToggleFavorite={toggleFavorite}
                            onDelete={handleDeleteRecipe}
                            onChefConsult={fetchRecipeChefDetails}
                            domain={getDomainName(recipe.url)}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-brand-900 text-brand-200/80 text-xs py-8 px-6 border-t border-brand-800 mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-7xl w-full mx-auto justify-between rounded-t-2xl">
        <div>
          <span className="font-serif font-bold text-lg text-brand-100 block">L'Atelier Gourmet</span>
          <p className="mt-1 text-[11px] text-brand-200/60 leading-relaxed max-w-md">
            This workspace dynamically manages local bookmark links using an integrated parser. Organize, view, categorize, and seek quick instructions without leaving your index.
          </p>
        </div>
        <div className="flex flex-col md:items-end md:justify-center text-left md:text-right gap-1 font-mono text-xxs mt-4 md:mt-0 text-brand-100/70">
          <span>Server integration: RUNNING</span>
          <span>Security Context: FULLY HIDDEN GUEST GATEWAY</span>
          <span>Google AI Studio Built Applet • 2026</span>
        </div>
      </footer>

      {/* MANUALLY ADD MODAL BLOCK */}
      <AnimatePresence>
        {isManualModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-brand-200"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-lg font-serif font-bold text-slate-800 flex items-center gap-2">
                  <Plus className="text-brand-600 animate-spin" size={18} /> Add Manual Link
                </h3>
                <button 
                  onClick={() => setIsManualModalOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleManualAdd} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Recipe Title *</label>
                  <input
                    type="text"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="e.g. Grandma's Famous Lasagna"
                    required
                    className="w-full text-sm p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Recipe Web Address (URL) *</label>
                  <input
                    type="url"
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    placeholder="e.g. https://www.allrecipes.com/recipe/lasagna"
                    required
                    className="w-full text-sm p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category *</label>
                    <select
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value as RecipeCategory)}
                      className="w-full text-sm p-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="appetizer">Appetizer</option>
                      <option value="soups">Soups</option>
                      <option value="entree">Entree</option>
                      <option value="main">Main Course</option>
                      <option value="desert">Dessert</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Core Class *</label>
                    <select
                      value={manualBase}
                      onChange={(e) => setManualBase(e.target.value as RecipeBase)}
                      className="w-full text-sm p-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="vegetable">Vegetable / Green</option>
                      <option value="meat">Meat / Seafood</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ingredient Class (Sub-category)</label>
                  <input
                    type="text"
                    value={manualSubCategory}
                    onChange={(e) => setManualSubCategory(e.target.value)}
                    placeholder="e.g. Mushroom, Chicken, Beef, Pork, Chocolate"
                    className="w-full text-sm p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Specify the defining protein or veggie to list them separately.</p>
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsManualModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg cursor-pointer shadow-md transition duration-150"
                  >
                    Add Recipe Card
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI COMPANION DRAWER SCREEN */}
      <AnimatePresence>
        {selectedRecipeForAI && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-end z-50">
            {/* Backdrop click closer */}
            <div className="absolute inset-0" onClick={() => setSelectedRecipeForAI(null)} />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-lg h-full shadow-2xl relative z-10 flex flex-col border-l border-brand-200"
            >
              
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-orange-50/50 to-brand-50/50 flex justify-between items-start gap-4">
                <div>
                  <span className="text-[10px] font-bold text-brand-600 bg-brand-100 uppercase tracking-widest px-2.5 py-1 rounded-full inline-block">
                    ✦ AI Head Chef Companion
                  </span>
                  <h3 className="text-lg font-serif font-bold text-slate-800 mt-2 leading-tight">
                    {selectedRecipeForAI.title}
                  </h3>
                  <a 
                    href={selectedRecipeForAI.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs text-brand-600 hover:underline inline-flex items-center gap-1 mt-1 font-mono hover:text-brand-700"
                  >
                    Visit Bookmark Address <ExternalLink size={11} />
                  </a>
                </div>
                <button 
                  onClick={() => setSelectedRecipeForAI(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                
                {isAiChefLoading && (
                  <div className="py-20 flex flex-col items-center justify-center text-center gap-4">
                    <div className="relative">
                      <ChefHat size={44} className="text-brand-600 animate-spin" />
                      <Sparkles size={16} className="text-amber-500 absolute -right-1 -top-1 animate-ping" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Formulating Chef Secrets</h4>
                      <p className="text-xxs text-slate-400 mt-1 max-w-[250px] leading-relaxed mx-auto">
                        We are sending this recipe bookmark details to Gemini AI to generate a curated kitchen guide index...
                      </p>
                    </div>

                    {/* Fun kitchen loadings */}
                    <div className="text-xxs px-3 py-1.5 bg-brand-100/50 text-brand-800 rounded-full font-mono mt-2 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-600 animate-pulse"></span>
                      <span>Stirring sauces, folding whipped creams...</span>
                    </div>
                  </div>
                )}

                {aiChefError && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-800">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold">Chef Assistant Blocked</h4>
                      <p className="text-xxs text-slate-600 mt-1">{aiChefError}</p>
                    </div>
                  </div>
                )}

                {!isAiChefLoading && aiChefOverview && (
                  <div className="space-y-5 text-slate-700 prose prose-slate max-w-none text-sm">
                    {/* Beautiful manual formatting for Markdown output */}
                    <div className="bg-amber-50/40 p-4 border border-brand-100 rounded-xl space-y-4">
                      {aiChefOverview.split('\n\n').map((paragraph, index) => {
                        let text = paragraph.trim();
                        if (!text) return null;

                        // Header detection
                        if (text.startsWith('1. **Description**') || text.startsWith('**Description**') || text.includes('Description:')) {
                          return (
                            <div key={index} className="space-y-1">
                              <span className="text-xs font-extrabold text-brand-800 uppercase tracking-widest block">📝 Classic Description</span>
                              <p className="text-xs text-slate-700 leading-relaxed font-light italic">
                                {text.replace(/^[0-9.]+\s*\*\*Description\*\*:\s*/i, '').replace(/^\*\*Description\*\*:\s*/i, '')}
                              </p>
                            </div>
                          );
                        }

                        if (text.startsWith('2. **Core Ingredients**') || text.startsWith('**Core Ingredients**') || text.includes('Ingredients:')) {
                          const lines = text.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('*') || l.trim().match(/^[0-9]/));
                          return (
                            <div key={index} className="space-y-1 pt-2 border-t border-brand-100/50">
                              <span className="text-xs font-extrabold text-brand-800 uppercase tracking-widest block mb-2">🧂 Primary Elements</span>
                              <ul className="text-xs grid grid-cols-2 gap-2">
                                {lines.map((l, lIdx) => (
                                  <li key={lIdx} className="flex items-center gap-2 bg-white/80 p-2 rounded-lg border border-brand-100">
                                    <span className="text-brand-600 text-[10px]">●</span>
                                    <span className="font-medium text-slate-800">{l.replace(/^[-*+0-9.]\s*/, '')}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        }

                        if (text.startsWith('3. **Chef\'s Pro Tip**') || text.startsWith('**Chef\'s Pro Tip**') || text.includes('Pro Tip:')) {
                          return (
                            <div key={index} className="bg-brand-100 p-4 rounded-xl space-y-1.5 border border-brand-200">
                              <span className="text-xs font-extrabold text-brand-900 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles size={14} className="text-brand-600 animate-spin" /> Chef's Culinary Pro Tip
                              </span>
                              <p className="text-xs text-slate-800 leading-relaxed font-serif italic">
                                {text.replace(/^[0-9.]+\s*\*\*Chef's Pro Tip\*\*:\s*/i, '').replace(/^\*\*Chef's Pro Tip\*\*:\s*/i, '')}
                              </p>
                            </div>
                          );
                        }

                        // Fallback text output helper
                        return (
                          <p key={index} className="text-xs leading-relaxed text-slate-600">
                            {text}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer footer close */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setSelectedRecipeForAI(null)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer transition duration-150"
                >
                  Close Insights
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Sub-Component RecipeCard for visual list items
interface RecipeCardProps {
  key?: string;
  recipe: Recipe;
  isFavorited: boolean;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onChefConsult: (recipe: Recipe) => void;
  domain: string;
}

// Global culinary emoji classifier based on subCategory, category, and base
const getRecipeEmoji = (subCategory?: string, category?: string, base?: string): string => {
  const s = (subCategory || '').toLowerCase();
  const c = (category || '').toLowerCase();
  const b = (base || '').toLowerCase();

  // 1. Specific subCategory/ingredient matches
  if (s.includes('chicken') || s.includes('poultry')) return '🍗';
  if (s.includes('beef') || s.includes('steak') || s.includes('ribeye') || s.includes('burger')) return '🥩';
  if (s.includes('pork') || s.includes('bacon') || s.includes('sausage') || s.includes('ham') || s.includes('pancetta')) return '🥓';
  if (s.includes('salmon') || s.includes('fish') || s.includes('tuna')) return '🐟';
  if (s.includes('shrimp') || s.includes('prawn')) return '🍤';
  if (s.includes('crab') || s.includes('lobster')) return '🦀';
  if (s.includes('seafood') || s.includes('squid') || s.includes('clam') || s.includes('mussel')) return '🍤';
  if (s.includes('lamb') || s.includes('mutton') || s.includes('goat')) return '🍖';
  if (s.includes('duck')) return '🦆';
  
  if (s.includes('broccoli') || s.includes('cauliflower') || s.includes('brussels')) return '🥦';
  if (s.includes('potato')) return '🥔';
  if (s.includes('mushroom')) return '🍄';
  if (s.includes('tomato')) return '🍅';
  if (s.includes('spinach') || s.includes('salad') || s.includes('green') || s.includes('herb') || s.includes('leaf')) return '🥬';
  if (s.includes('eggplant') || s.includes('aubergine')) return '🍆';
  if (s.includes('avocado')) return '🥑';
  if (s.includes('cheese') || s.includes('parmesan')) return '🧀';
  if (s.includes('garlic')) return '🧄';
  if (s.includes('onion')) return '🧅';
  if (s.includes('rice')) return '🍚';
  if (s.includes('pasta') || s.includes('noodle')) return '🍝';

  if (s.includes('chocolate')) return '🍫';
  if (s.includes('strawberry')) return '🍓';
  if (s.includes('apple')) return '🍎';
  if (s.includes('banana')) return '🍌';
  if (s.includes('orange')) return '🍊';
  if (s.includes('lemon') || s.includes('lime')) return '🍋';
  if (s.includes('berry') || s.includes('blueberry') || s.includes('raspberry')) return '🫐';
  if (s.includes('cherry')) return '🍒';
  
  // 2. Fallbacks based on category/base flags
  if (c === 'desert' || s.includes('sweet') || s.includes('cake') || s.includes('cookie') || s.includes('pudding') || s.includes('treat')) return '🍰';
  if (c === 'soups' || s.includes('broth') || s.includes('soup') || s.includes('stock')) return '🥣';
  if (c === 'appetizer') return '🍢';
  if (b === 'meat') return '🥩';
  if (b === 'vegetable') return '🥗';

  return '🍽️';
};

function RecipeCard({ 
  recipe, 
  isFavorited, 
  onToggleFavorite, 
  onDelete, 
  onChefConsult,
  domain 
}: RecipeCardProps) {
  // Local resolver matching specific subcategories or categories to gorgeous Unsplash templates
  const getCardImage = () => {
    const s = (recipe.subCategory || '').toLowerCase();
    const c = (recipe.category || '').toLowerCase();
    const base = (recipe.base || 'vegetable').toLowerCase();
    
    if (s.includes('chicken') || s.includes('poultry')) {
      return 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=300&auto=format&fit=crop&q=80';
    }
    if (s.includes('beef') || s.includes('steak') || s.includes('ribeye') || s.includes('burger')) {
      return 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&auto=format&fit=crop&q=80';
    }
    if (s.includes('pork') || s.includes('bacon') || s.includes('sausage') || s.includes('ham')) {
      return 'https://images.unsplash.com/photo-1524438418049-ab2acb7aa48f?w=300&auto=format&fit=crop&q=80';
    }
    if (s.includes('salmon') || s.includes('seafood') || s.includes('shrimp') || s.includes('fish') || s.includes('crab') || s.includes('prawn') || s.includes('lobster') || s.includes('tuna') || s.includes('squid')) {
      return 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=300&auto=format&fit=crop&q=80';
    }
    if (s.includes('lamb') || s.includes('duck')) {
      return 'https://images.unsplash.com/photo-1514516369-197ac21e0cd2?w=300&auto=format&fit=crop&q=80';
    }
    if (s.includes('broccoli') || s.includes('cauliflower') || s.includes('brussels')) {
      return 'https://images.unsplash.com/photo-1583745025064-07d27e040fb6?w=300&auto=format&fit=crop&q=80';
    }
    if (s.includes('potato')) {
      return 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&auto=format&fit=crop&q=80';
    }
    if (s.includes('mushroom')) {
      return 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300&auto=format&fit=crop&q=80';
    }
    if (s.includes('tomato') || s.includes('sandwich') || s.includes('bruschetta')) {
      return 'https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=300&auto=format&fit=crop&q=80';
    }
    if (s.includes('chocolate') || s.includes('lava cake') || s.includes('desert') || s.includes('sweet') || s.includes('cake')) {
      return 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300&auto=format&fit=crop&q=80';
    }
    if (s.includes('apple') || s.includes('strawberry') || s.includes('fruit') || s.includes('berry') || s.includes('parfait')) {
      return 'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=300&auto=format&fit=crop&q=80';
    }
    if (s.includes('spinach') || s.includes('eggplant') || s.includes('salad') || s.includes('greens') || base === 'vegetable') {
      if (c === 'desert') {
        return 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=300&auto=format&fit=crop&q=80';
      }
      return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&auto=format&fit=crop&q=80';
    }

    if (c === 'desert') {
      return 'https://images.unsplash.com/photo-149514740007a-f8a53e30b22d?w=300&auto=format&fit=crop&q=80';
    }
    if (c === 'soups') {
      return 'https://images.unsplash.com/photo-1547592180-85f173990554?w=300&auto=format&fit=crop&q=80';
    }
    if (c === 'appetizer') {
      return 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=300&auto=format&fit=crop&q=80';
    }
    if (c === 'entree') {
      return 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&auto=format&fit=crop&q=80';
    }
    
    return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&auto=format&fit=crop&q=80';
  };

  return (
    <div className="group bg-slate-50/55 hover:bg-amber-50/40 p-3 rounded-xl border border-slate-200 hover:border-brand-300 transition duration-150 flex flex-col justify-between gap-3 shadow-xxs">
      
      {/* Title block with cover image */}
      <div className="flex gap-3 items-start">
        {/* Beautiful high quality cover art */}
        <div className="w-[68px] h-[68px] md:w-[72px] md:h-[72px] shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200/65 relative shadow-xxs">
          <img 
            src={getCardImage()} 
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300 ease-out"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Info elements */}
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <a
              href={recipe.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-slate-800 hover:text-brand-700 leading-snug group-hover:underline flex items-start gap-1.5 cursor-pointer line-clamp-2"
            >
              <span className="text-sm select-none shrink-0" role="img" aria-label={recipe.subCategory}>
                {getRecipeEmoji(recipe.subCategory, recipe.category, recipe.base)}
              </span>
              <span>{recipe.title}</span>
            </a>
            
            <button 
              type="button"
              onClick={() => onToggleFavorite(recipe.id)}
              className={`p-1 rounded-full cursor-pointer transition duration-150 shrink-0
                ${isFavorited ? 'text-rose-500 bg-rose-50 hover:bg-rose-100' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'}`}
            >
              <Heart size={14} fill={isFavorited ? "currentColor" : "none"} />
            </button>
          </div>
          
          {/* Domain name origin info */}
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-slate-400">
            <span className="px-1.5 py-0.2 bg-slate-200/60 rounded-sm font-sans font-medium text-slate-500 uppercase tracking-widest text-[8px]">
              {recipe.source === 'uploaded' ? 'Custom' : 'Preloaded'}
            </span>
            <span>●</span>
            <span className="truncate">{domain}</span>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 gap-2">
        <button
          onClick={() => onChefConsult(recipe)}
          className="text-[10px] font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1 cursor-pointer transition duration-150 opacity-90 hover:opacity-100 bg-brand-100 px-2.5 py-1 rounded"
        >
          <Sparkles size={11} className="text-brand-600 animate-pulse" />
          Chef Tips
        </button>

        <div className="flex items-center gap-1">
          <a
            href={recipe.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 text-slate-500 hover:text-brand-700 hover:bg-brand-50 rounded cursor-pointer transition duration-150"
            title="Open real recipe address website"
          >
            <ExternalLink size={13} />
          </a>

          {recipe.source === 'uploaded' && (
            <button
              onClick={() => onDelete(recipe.id)}
              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer transition duration-150"
              title="Remove recipe card"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
