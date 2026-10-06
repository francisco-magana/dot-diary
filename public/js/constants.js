// Colors and icon sets used across the app.

export const PALETTE = {
  black: '#1d1b1a',
  red: 'oklch(0.63 0.21 27)',
  green: 'oklch(0.66 0.17 150)',
  blue: 'oklch(0.58 0.2 258)',
  gray: '#9a948f',
  orange: 'oklch(0.72 0.17 58)',
  yellow: 'oklch(0.82 0.16 88)',
};

/** Shown in "Recent" until the user has picked enough icons of their own. */
export const DEFAULT_RECENT_ICONS = ['call', 'person', 'flight', 'star', 'sunny', 'favorite', 'hiking'];

/** Icon used when a day gets a label but no icon was chosen. */
export const FALLBACK_ICON = 'edit_note';

/** Icon picker categories: [name, tab icon, icons]. Names are Material Symbols. */
export const ICON_CATEGORIES = [
  ['Weather', 'partly_cloudy_day', ['sunny', 'partly_cloudy_day', 'cloud', 'rainy', 'thunderstorm', 'ac_unit', 'foggy', 'air', 'bedtime', 'clear_night', 'wb_twilight', 'water_drop', 'umbrella', 'thermostat']],
  ['People', 'person', ['person', 'group', 'call', 'videocam', 'chat', 'mail', 'favorite', 'cake', 'child_care', 'family_restroom', 'handshake', 'diversity_3', 'record_voice_over', 'sentiment_satisfied']],
  ['Travel', 'flight', ['flight', 'train', 'directions_car', 'directions_bike', 'hotel', 'luggage', 'map', 'beach_access', 'hiking', 'landscape', 'sailing', 'local_taxi', 'directions_boat', 'tour']],
  ['Activity', 'directions_run', ['directions_run', 'fitness_center', 'sports_soccer', 'pool', 'self_improvement', 'sports_tennis', 'music_note', 'brush', 'menu_book', 'movie', 'sports_esports', 'photo_camera', 'local_florist', 'pets']],
  ['Food', 'restaurant', ['restaurant', 'local_cafe', 'local_bar', 'bakery_dining', 'lunch_dining', 'ramen_dining', 'local_pizza', 'icecream', 'wine_bar', 'liquor', 'egg', 'nutrition', 'cookie', 'kitchen']],
  ['Things', 'category', ['star', 'flag', 'bookmark', 'emoji_events', 'notifications', 'credit_card', 'shopping_cart', 'home', 'work', 'school', 'local_hospital', 'celebration', 'lightbulb', 'key']],
];

/** Days per calendar row (7, 14 or 21 all work). */
export const GRID_COLUMNS = 14;
