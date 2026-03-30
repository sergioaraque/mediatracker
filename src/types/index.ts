export type MediaType   = 'movie' | 'series' | 'book'
export type MediaStatus = 'watched' | 'watching' | 'pending'

export interface Media {
  $id:             string
  $createdAt:      string
  $updatedAt:      string
  title:           string
  type:            MediaType
  year:            number | null
  genre:           string | null
  cover_url:       string | null
  status:          MediaStatus
  rating:          number | null
  description:     string | null
  current_season:  number | null
  current_episode: number | null
  finished_at:     string | null
}

export interface Progress {
  $id:             string
  media_id:        string
  current_season:  number | null
  current_episode: number | null
  total_seasons:   number | null
  total_episodes:  number | null
  notes:           string | null
}

export interface MediaFormData {
  title:           string
  type:            MediaType
  year:            number | null
  genre:           string | null
  cover_url:       string | null
  status:          MediaStatus
  rating:          number | null
  description:     string | null
  current_season:  number | null
  current_episode: number | null
  total_seasons:   number | null
  total_episodes:  number | null
  progress_notes:  string | null
}
