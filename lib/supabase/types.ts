export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_templates: {
        Row: {
          created_at: string
          created_by: string
          default_assignments: Json
          floor_id: string
          id: string
          is_active: boolean
          is_recurring: boolean
          last_generated_date: string | null
          name: string
          notes: string | null
          org_id: string
          recurrence_days: string[]
          recurrence_preset: string | null
          time_slots: Json
          updated_at: string
          window_end: string
          window_start: string
        }
        Insert: {
          created_at?: string
          created_by: string
          default_assignments?: Json
          floor_id: string
          id?: string
          is_active?: boolean
          is_recurring?: boolean
          last_generated_date?: string | null
          name: string
          notes?: string | null
          org_id: string
          recurrence_days?: string[]
          recurrence_preset?: string | null
          time_slots?: Json
          updated_at?: string
          window_end?: string
          window_start?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          default_assignments?: Json
          floor_id?: string
          id?: string
          is_active?: boolean
          is_recurring?: boolean
          last_generated_date?: string | null
          name?: string
          notes?: string | null
          org_id?: string
          recurrence_days?: string[]
          recurrence_preset?: string | null
          time_slots?: Json
          updated_at?: string
          window_end?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_templates_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          building_id: string
          clock_in_at: string
          clock_out_at: string | null
          created_at: string
          date: string
          distance_m: number | null
          geo_error: string | null
          geo_verified: boolean
          id: string
          org_id: string
          scan_latitude: number | null
          scan_longitude: number | null
          user_id: string
        }
        Insert: {
          building_id: string
          clock_in_at?: string
          clock_out_at?: string | null
          created_at?: string
          date?: string
          distance_m?: number | null
          geo_error?: string | null
          geo_verified?: boolean
          id?: string
          org_id: string
          scan_latitude?: number | null
          scan_longitude?: number | null
          user_id: string
        }
        Update: {
          building_id?: string
          clock_in_at?: string
          clock_out_at?: string | null
          created_at?: string
          date?: string
          distance_m?: number | null
          geo_error?: string | null
          geo_verified?: boolean
          id?: string
          org_id?: string
          scan_latitude?: number | null
          scan_longitude?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      building_supervisors: {
        Row: {
          building_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          building_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          building_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "building_supervisors_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "building_supervisors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          address: string
          attendance_qr_path: string | null
          client_id: string | null
          created_at: string
          geofence_radius_m: number
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          org_id: string
          status: string
        }
        Insert: {
          address: string
          attendance_qr_path?: string | null
          client_id?: string | null
          created_at?: string
          geofence_radius_m?: number
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          org_id: string
          status?: string
        }
        Update: {
          address?: string
          attendance_qr_path?: string | null
          client_id?: string | null
          created_at?: string
          geofence_radius_m?: number
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          org_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "buildings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buildings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          created_at: string
          description: string
          id: string
          item_order: number
          org_id: string
          requires_note: boolean
          requires_photo: boolean
          template_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          item_order: number
          org_id: string
          requires_note?: boolean
          requires_photo?: boolean
          template_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          item_order?: number
          org_id?: string
          requires_note?: boolean
          requires_photo?: boolean
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          org_id: string
          room_type_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          org_id: string
          room_type_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          org_id?: string
          room_type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_templates_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_activities: {
        Row: {
          created_at: string
          created_by: string
          floor_id: string
          id: string
          name: string
          notes: string | null
          org_id: string
          scheduled_date: string
          source_template_id: string | null
          status: Database["public"]["Enums"]["activity_status"]
          updated_at: string
          window_end: string
          window_start: string
        }
        Insert: {
          created_at?: string
          created_by: string
          floor_id: string
          id?: string
          name: string
          notes?: string | null
          org_id: string
          scheduled_date: string
          source_template_id?: string | null
          status?: Database["public"]["Enums"]["activity_status"]
          updated_at?: string
          window_end: string
          window_start: string
        }
        Update: {
          created_at?: string
          created_by?: string
          floor_id?: string
          id?: string
          name?: string
          notes?: string | null
          org_id?: string
          scheduled_date?: string
          source_template_id?: string | null
          status?: Database["public"]["Enums"]["activity_status"]
          updated_at?: string
          window_end?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_activities_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_activities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_activities_source_template_id_fkey"
            columns: ["source_template_id"]
            isOneToOne: false
            referencedRelation: "activity_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          company_name: string
          contact_email: string
          contact_name: string
          created_at: string
          id: string
          org_id: string
        }
        Insert: {
          company_name: string
          contact_email: string
          contact_name: string
          created_at?: string
          id?: string
          org_id: string
        }
        Update: {
          company_name?: string
          contact_email?: string
          contact_name?: string
          created_at?: string
          id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      deficiencies: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string
          id: string
          org_id: string
          photo_url: string | null
          reported_by: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          room_task_id: string
          severity: string
          status: Database["public"]["Enums"]["deficiency_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description: string
          id?: string
          org_id: string
          photo_url?: string | null
          reported_by: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          room_task_id: string
          severity?: string
          status?: Database["public"]["Enums"]["deficiency_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string
          id?: string
          org_id?: string
          photo_url?: string | null
          reported_by?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          room_task_id?: string
          severity?: string
          status?: Database["public"]["Enums"]["deficiency_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deficiencies_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deficiencies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deficiencies_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deficiencies_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deficiencies_room_task_id_fkey"
            columns: ["room_task_id"]
            isOneToOne: false
            referencedRelation: "room_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      floors: {
        Row: {
          building_id: string
          created_at: string
          floor_name: string
          floor_number: number
          id: string
          org_id: string
          plan_status: Database["public"]["Enums"]["plan_status"]
        }
        Insert: {
          building_id: string
          created_at?: string
          floor_name: string
          floor_number: number
          id?: string
          org_id: string
          plan_status?: Database["public"]["Enums"]["plan_status"]
        }
        Update: {
          building_id?: string
          created_at?: string
          floor_name?: string
          floor_number?: number
          id?: string
          org_id?: string
          plan_status?: Database["public"]["Enums"]["plan_status"]
        }
        Relationships: [
          {
            foreignKeyName: "floors_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "floors_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          org_id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          org_id: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          org_id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          pass_threshold: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          pass_threshold?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          pass_threshold?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      room_checklist_overrides: {
        Row: {
          created_at: string
          org_id: string
          room_id: string
          template_id: string
        }
        Insert: {
          created_at?: string
          org_id: string
          room_id: string
          template_id: string
        }
        Update: {
          created_at?: string
          org_id?: string
          room_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_checklist_overrides_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_checklist_overrides_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: true
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_checklist_overrides_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      room_tasks: {
        Row: {
          activity_id: string
          assigned_to: string | null
          checked_in_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          inspected_at: string | null
          inspected_by: string | null
          inspection_note: string | null
          inspection_scan_at: string | null
          org_id: string
          room_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["room_status"]
          updated_at: string
        }
        Insert: {
          activity_id: string
          assigned_to?: string | null
          checked_in_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          inspected_at?: string | null
          inspected_by?: string | null
          inspection_note?: string | null
          inspection_scan_at?: string | null
          org_id: string
          room_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
        }
        Update: {
          activity_id?: string
          assigned_to?: string | null
          checked_in_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          inspected_at?: string | null
          inspected_by?: string | null
          inspection_note?: string | null
          inspection_scan_at?: string | null
          org_id?: string
          room_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_tasks_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "cleaning_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_tasks_inspected_by_fkey"
            columns: ["inspected_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_tasks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_types: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          org_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          org_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_types_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string
          floor_id: string
          id: string
          is_active: boolean
          name: string
          org_id: string
          pin_x: number | null
          pin_y: number | null
          qr_code_url: string | null
          room_type_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          floor_id: string
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          pin_x?: number | null
          pin_y?: number | null
          qr_code_url?: string | null
          room_type_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          floor_id?: string
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          pin_x?: number | null
          pin_y?: number | null
          qr_code_url?: string | null
          room_type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      task_item_responses: {
        Row: {
          checklist_item_id: string
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          note: string | null
          org_id: string
          photo_url: string | null
          room_task_id: string
          updated_at: string
        }
        Insert: {
          checklist_item_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          note?: string | null
          org_id: string
          photo_url?: string | null
          room_task_id: string
          updated_at?: string
        }
        Update: {
          checklist_item_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          note?: string | null
          org_id?: string
          photo_url?: string | null
          room_task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_item_responses_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_item_responses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_item_responses_room_task_id_fkey"
            columns: ["room_task_id"]
            isOneToOne: false
            referencedRelation: "room_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          org_id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name: string
          id: string
          is_active?: boolean
          last_name: string
          org_id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          org_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      vectorised_plans: {
        Row: {
          created_at: string
          extracted_at: string | null
          extracted_data: Json | null
          extraction_error: string | null
          extraction_status: string
          floor_id: string
          id: string
          org_id: string
          original_path: string
          svg_path: string | null
        }
        Insert: {
          created_at?: string
          extracted_at?: string | null
          extracted_data?: Json | null
          extraction_error?: string | null
          extraction_status?: string
          floor_id: string
          id?: string
          org_id: string
          original_path: string
          svg_path?: string | null
        }
        Update: {
          created_at?: string
          extracted_at?: string | null
          extracted_data?: Json | null
          extraction_error?: string | null
          extraction_status?: string
          floor_id?: string
          id?: string
          org_id?: string
          original_path?: string
          svg_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vectorised_plans_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: true
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vectorised_plans_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_org_id: { Args: never; Returns: string }
      auth_role: { Args: never; Returns: string }
      seed_default_checklists: {
        Args: { p_org_id: string }
        Returns: undefined
      }
      seed_default_room_types: {
        Args: { p_org_id: string }
        Returns: undefined
      }
    }
    Enums: {
      activity_status: "draft" | "active" | "closed" | "cancelled"
      deficiency_status: "open" | "in_progress" | "resolved"
      inspection_status: "pass" | "fail"
      plan_status: "none" | "uploaded" | "vectorised" | "confirmed"
      room_status:
        | "unassigned"
        | "not_started"
        | "in_progress"
        | "done"
        | "inspected_pass"
        | "inspected_fail"
        | "has_issues"
      user_role: "admin" | "supervisor" | "janitor" | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_status: ["draft", "active", "closed", "cancelled"],
      deficiency_status: ["open", "in_progress", "resolved"],
      inspection_status: ["pass", "fail"],
      plan_status: ["none", "uploaded", "vectorised", "confirmed"],
      room_status: [
        "unassigned",
        "not_started",
        "in_progress",
        "done",
        "inspected_pass",
        "inspected_fail",
        "has_issues",
      ],
      user_role: ["admin", "supervisor", "janitor", "client"],
    },
  },
} as const
