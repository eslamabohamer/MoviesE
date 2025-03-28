export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      content: {
        Row: {
          backdrop_url: string
          created_at: string
          description: string
          duration: number | null
          id: string
          is_featured: boolean | null
          rating: number | null
          release_year: number
          seasons: number | null
          thumbnail_url: string
          title: string
          type: Database["public"]["Enums"]["content_type"]
          updated_at: string
          video_servers: Json | null
          video_url: string | null
          visit_count: number | null
        }
        Insert: {
          backdrop_url: string
          created_at?: string
          description: string
          duration?: number | null
          id?: string
          is_featured?: boolean | null
          rating?: number | null
          release_year: number
          seasons?: number | null
          thumbnail_url: string
          title: string
          type: Database["public"]["Enums"]["content_type"]
          updated_at?: string
          video_servers?: Json | null
          video_url?: string | null
          visit_count?: number | null
        }
        Update: {
          backdrop_url?: string
          created_at?: string
          description?: string
          duration?: number | null
          id?: string
          is_featured?: boolean | null
          rating?: number | null
          release_year?: number
          seasons?: number | null
          thumbnail_url?: string
          title?: string
          type?: Database["public"]["Enums"]["content_type"]
          updated_at?: string
          video_servers?: Json | null
          video_url?: string | null
          visit_count?: number | null
        }
        Relationships: []
      }
      content_cast: {
        Row: {
          content_id: string
          created_at: string
          id: string
          is_main_cast: boolean | null
          person_id: string
          role: string
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          is_main_cast?: boolean | null
          person_id: string
          role: string
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          is_main_cast?: boolean | null
          person_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_cast_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_cast_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      content_genres: {
        Row: {
          content_id: string
          created_at: string
          genre_id: string
          id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          genre_id: string
          id?: string
        }
        Update: {
          content_id?: string
          created_at?: string
          genre_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_genres_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_genres_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          created_at: string
          description: string
          duration: number
          episode_number: number
          id: string
          release_date: string | null
          season: number
          series_id: string
          thumbnail_url: string
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          created_at?: string
          description: string
          duration: number
          episode_number: number
          id?: string
          release_date?: string | null
          season: number
          series_id: string
          thumbnail_url: string
          title: string
          updated_at?: string
          video_url: string
        }
        Update: {
          created_at?: string
          description?: string
          duration?: number
          episode_number?: number
          id?: string
          release_date?: string | null
          season?: number
          series_id?: string
          thumbnail_url?: string
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "episodes_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          content_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      genres: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          name: string
          photo_url: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id?: string
          name: string
          photo_url?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          photo_url?: string | null
        }
        Relationships: []
      }
      rated_content: {
        Row: {
          content_id: string
          created_at: string
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rated_content_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string | null
          id: string
          role: string
          username: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          role?: string
          username: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          role?: string
          username?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          content_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_user_safe: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      get_all_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          email: string | null
          id: string
          role: string
          username: string
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_secure: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_user_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      update_user_safe: {
        Args: {
          user_id: string
          new_username?: string
          new_role?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      content_type: "movie" | "series"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
