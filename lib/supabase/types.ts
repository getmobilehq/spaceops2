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
      organisations: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          pass_threshold: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          pass_threshold?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          pass_threshold?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          org_id: string
          first_name: string
          last_name: string
          role: "admin" | "supervisor" | "janitor" | "client"
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          org_id: string
          first_name: string
          last_name: string
          role: "admin" | "supervisor" | "janitor" | "client"
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          first_name?: string
          last_name?: string
          role?: "admin" | "supervisor" | "janitor" | "client"
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          }
        ]
      }
      clients: {
        Row: {
          id: string
          org_id: string
          company_name: string
          contact_name: string
          contact_email: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          company_name: string
          contact_name: string
          contact_email: string
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          company_name?: string
          contact_name?: string
          contact_email?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          }
        ]
      }
      buildings: {
        Row: {
          id: string
          org_id: string
          client_id: string | null
          name: string
          address: string
          status: "active" | "inactive" | "setup"
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          client_id?: string | null
          name: string
          address: string
          status?: "active" | "inactive" | "setup"
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          client_id?: string | null
          name?: string
          address?: string
          status?: "active" | "inactive" | "setup"
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buildings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buildings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      building_supervisors: {
        Row: {
          building_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          building_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          building_id?: string
          user_id?: string
          created_at?: string
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
          }
        ]
      }
      floors: {
        Row: {
          id: string
          building_id: string
          org_id: string
          floor_number: number
          floor_name: string
          plan_status: "none" | "uploaded" | "vectorised" | "confirmed"
          created_at: string
        }
        Insert: {
          id?: string
          building_id: string
          org_id: string
          floor_number: number
          floor_name: string
          plan_status?: "none" | "uploaded" | "vectorised" | "confirmed"
          created_at?: string
        }
        Update: {
          id?: string
          building_id?: string
          org_id?: string
          floor_number?: number
          floor_name?: string
          plan_status?: "none" | "uploaded" | "vectorised" | "confirmed"
          created_at?: string
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
          }
        ]
      }
      vectorised_plans: {
        Row: {
          id: string
          floor_id: string
          org_id: string
          original_path: string
          svg_path: string | null
          created_at: string
        }
        Insert: {
          id?: string
          floor_id: string
          org_id: string
          original_path: string
          svg_path?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          floor_id?: string
          org_id?: string
          original_path?: string
          svg_path?: string | null
          created_at?: string
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
          }
        ]
      }
      room_types: {
        Row: {
          id: string
          org_id: string
          name: string
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          is_default?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_types_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          }
        ]
      }
      rooms: {
        Row: {
          id: string
          floor_id: string
          org_id: string
          name: string
          room_type_id: string
          qr_code_url: string | null
          pin_x: number | null
          pin_y: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          floor_id: string
          org_id: string
          name: string
          room_type_id: string
          qr_code_url?: string | null
          pin_x?: number | null
          pin_y?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          floor_id?: string
          org_id?: string
          name?: string
          room_type_id?: string
          qr_code_url?: string | null
          pin_x?: number | null
          pin_y?: number | null
          is_active?: boolean
          created_at?: string
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
          }
        ]
      }
      checklist_templates: {
        Row: {
          id: string
          org_id: string
          room_type_id: string | null
          name: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          room_type_id?: string | null
          name: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          room_type_id?: string | null
          name?: string
          is_default?: boolean
          created_at?: string
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
          }
        ]
      }
      checklist_items: {
        Row: {
          id: string
          template_id: string
          org_id: string
          description: string
          item_order: number
          requires_photo: boolean
          requires_note: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          template_id: string
          org_id: string
          description: string
          item_order: number
          requires_photo?: boolean
          requires_note?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          org_id?: string
          description?: string
          item_order?: number
          requires_photo?: boolean
          requires_note?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          }
        ]
      }
      room_checklist_overrides: {
        Row: {
          room_id: string
          template_id: string
          org_id: string
          created_at: string
        }
        Insert: {
          room_id: string
          template_id: string
          org_id: string
          created_at?: string
        }
        Update: {
          room_id?: string
          template_id?: string
          org_id?: string
          created_at?: string
        }
        Relationships: [
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
          {
            foreignKeyName: "room_checklist_overrides_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          }
        ]
      }
      cleaning_activities: {
        Row: {
          id: string
          org_id: string
          floor_id: string
          created_by: string
          name: string
          status: "draft" | "active" | "closed" | "cancelled"
          scheduled_date: string
          window_start: string
          window_end: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          floor_id: string
          created_by: string
          name: string
          status?: "draft" | "active" | "closed" | "cancelled"
          scheduled_date: string
          window_start: string
          window_end: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          floor_id?: string
          created_by?: string
          name?: string
          status?: "draft" | "active" | "closed" | "cancelled"
          scheduled_date?: string
          window_start?: string
          window_end?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_activities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
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
            foreignKeyName: "cleaning_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      room_tasks: {
        Row: {
          id: string
          activity_id: string
          room_id: string
          assigned_to: string | null
          org_id: string
          status: "unassigned" | "not_started" | "in_progress" | "done" | "inspected_pass" | "inspected_fail" | "has_issues"
          started_at: string | null
          completed_at: string | null
          inspected_by: string | null
          inspected_at: string | null
          inspection_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          activity_id: string
          room_id: string
          assigned_to?: string | null
          org_id: string
          status?: "unassigned" | "not_started" | "in_progress" | "done" | "inspected_pass" | "inspected_fail" | "has_issues"
          started_at?: string | null
          completed_at?: string | null
          inspected_by?: string | null
          inspected_at?: string | null
          inspection_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          activity_id?: string
          room_id?: string
          assigned_to?: string | null
          org_id?: string
          status?: "unassigned" | "not_started" | "in_progress" | "done" | "inspected_pass" | "inspected_fail" | "has_issues"
          started_at?: string | null
          completed_at?: string | null
          inspected_by?: string | null
          inspected_at?: string | null
          inspection_note?: string | null
          created_at?: string
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
            foreignKeyName: "room_tasks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
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
            foreignKeyName: "room_tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_tasks_inspected_by_fkey"
            columns: ["inspected_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      deficiencies: {
        Row: {
          id: string
          room_task_id: string
          org_id: string
          reported_by: string
          assigned_to: string | null
          description: string
          severity: string
          status: "open" | "in_progress" | "resolved"
          photo_url: string | null
          resolved_at: string | null
          resolved_by: string | null
          resolution_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_task_id: string
          org_id: string
          reported_by: string
          assigned_to?: string | null
          description: string
          severity?: string
          status?: "open" | "in_progress" | "resolved"
          photo_url?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolution_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_task_id?: string
          org_id?: string
          reported_by?: string
          assigned_to?: string | null
          description?: string
          severity?: string
          status?: "open" | "in_progress" | "resolved"
          photo_url?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolution_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deficiencies_room_task_id_fkey"
            columns: ["room_task_id"]
            isOneToOne: false
            referencedRelation: "room_tasks"
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
            foreignKeyName: "deficiencies_assigned_to_fkey"
            columns: ["assigned_to"]
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
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          org_id: string
          user_id: string
          type: string
          title: string
          body: string | null
          link: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          type: string
          title: string
          body?: string | null
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          user_id?: string
          type?: string
          title?: string
          body?: string | null
          link?: string | null
          is_read?: boolean
          created_at?: string
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
          }
        ]
      }
      activity_templates: {
        Row: {
          id: string
          org_id: string
          created_by: string
          name: string
          floor_id: string
          window_start: string
          window_end: string
          notes: string | null
          default_assignments: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          created_by: string
          name: string
          floor_id: string
          window_start?: string
          window_end?: string
          notes?: string | null
          default_assignments?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          created_by?: string
          name?: string
          floor_id?: string
          window_start?: string
          window_end?: string
          notes?: string | null
          default_assignments?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
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
          }
        ]
      }
      task_item_responses: {
        Row: {
          id: string
          room_task_id: string
          checklist_item_id: string
          org_id: string
          is_completed: boolean
          photo_url: string | null
          note: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_task_id: string
          checklist_item_id: string
          org_id: string
          is_completed?: boolean
          photo_url?: string | null
          note?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_task_id?: string
          checklist_item_id?: string
          org_id?: string
          is_completed?: boolean
          photo_url?: string | null
          note?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_item_responses_room_task_id_fkey"
            columns: ["room_task_id"]
            isOneToOne: false
            referencedRelation: "room_tasks"
            referencedColumns: ["id"]
          },
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
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_org_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      auth_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      user_role: "admin" | "supervisor" | "janitor" | "client"
      activity_status: "draft" | "active" | "closed" | "cancelled"
      room_status:
        | "unassigned"
        | "not_started"
        | "in_progress"
        | "done"
        | "inspected_pass"
        | "inspected_fail"
        | "has_issues"
      deficiency_status: "open" | "in_progress" | "resolved"
      plan_status: "none" | "uploaded" | "vectorised" | "confirmed"
      inspection_status: "pass" | "fail"
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T]
