import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ban, MessageSquare, Coins, Upload, Megaphone } from "lucide-react";
import logo from "@/assets/logo.png";
import homeButton from "@/assets/buttons/home-button.png";
import { RichTextEditor } from "@/components/RichTextEditor";

const DISCIPLINES = ["Shadow", "All-Seeing", "Titan", "Emperor", "Finisher", "Lightbringer"];

const adminUserSchema = z.object({
  username: z.string()
    .trim()
    .min(1, { message: "Username cannot be empty" })
    .max(50, { message: "Username must be less than 50 characters" }),
  xp_points: z.number()
    .int({ message: "XP must be a whole number" })
    .min(0, { message: "XP cannot be negative" })
    .max(1000000, { message: "XP cannot exceed 1,000,000" }),
  tokens: z.number()
    .int({ message: "Tokens must be a whole number" })
    .min(0, { message: "Tokens cannot be negative" })
    .max(100000, { message: "Tokens cannot exceed 100,000" }),
  discipline: z.string().min(1, { message: "Discipline is required" }),
  admin_note: z.string().max(500, { message: "Admin note must be less than 500 characters" })
});

const AdminPanel = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [mentors, setMentors] = useState<any[]>([]);
  const [userMentors, setUserMentors] = useState<any[]>([]);
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);
  const [storeItems, setStoreItems] = useState<any[]>([]);
  const [techniques, setTechniques] = useState<any[]>([]);
  const [mentorRequests, setMentorRequests] = useState<any[]>([]);
  const [dataMissions, setDataMissions] = useState<any[]>([]);
  const [worldMissions, setWorldMissions] = useState<any[]>([]);
  const [newDataMission, setNewDataMission] = useState({
    question: "",
    options: ["", "", ""],
    correct_answer: "",
    image_url: ""
  });
  const [newWorldMission, setNewWorldMission] = useState({
    questions: [
      { question: "", options: ["", "", ""], correct_answer: "", image_url: "" },
      { question: "", options: ["", "", ""], correct_answer: "", image_url: "" },
      { question: "", options: ["", "", ""], correct_answer: "", image_url: "" }
    ]
  });
  const [globalMessage, setGlobalMessage] = useState("");
  const [banReason, setBanReason] = useState("");
  const [userToBan, setUserToBan] = useState<any>(null);
  const [editingStoreItem, setEditingStoreItem] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newStoreItem, setNewStoreItem] = useState({
    name: "",
    description: "",
    type: "title",
    price: 0,
    image_url: "",
    level_requirement: 1,
    mentor_id: ""
  });
  const [newTechnique, setNewTechnique] = useState({
    name: "",
    description: "",
    type_info: "",
    cep: "",
    price: 0,
    level_requirement: 1,
    mentor_id: "",
    image_url: "",
    // New Arena System Fields
    damage: 0,
    armor_damage: 0,
    armor_given: 0,
    aura_damage: 0,
    given_aura: 0,
    heal: 0,
    tags: [] as string[],
    energy_cost: 0,
    energy_given: 0,
    cooldown: 1,
    opponent_status: null as string | null,
    self_status: null as string | null,
    no_hit_m: null as number | null,
    specific_status_hit: null as string | null,
    mastery_given: 0,
    mastery_taken: 0,
    no_hit_e: null as number | null,
    no_use_e: null as number | null,
    no_use_m: null as number | null,
    atk_boost: 0,
    atk_debuff: 0,
  });
  const [newMentor, setNewMentor] = useState({
    name: "",
    description: "",
    image_url: ""
  });
  const [editingTechnique, setEditingTechnique] = useState<any>(null);
  const [editingMentor, setEditingMentor] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    message: ""
  });
  const [cloudoMessage, setCloudoMessage] = useState("");
  const [currentCloudoMessage, setCurrentCloudoMessage] = useState<any>(null);
  const [arenaMessage, setArenaMessage] = useState("");
  const [arenaMessages, setArenaMessages] = useState<any[]>([]);
  const [editForm, setEditForm] = useState({
    username: "",
    xp_points: 0,
    tokens: 0,
    discipline: "",
    admin_note: "",
    mentor1: "",
    mentor2: "",
  });

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/login");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      toast.error("Access denied: Admin only");
      navigate("/dashboard");
      return;
    }

    setIsAdmin(true);
    fetchUsers();
    fetchMentors();
    fetchBannedUsers();
    fetchStoreItems();
    fetchTechniques();
    fetchMentorRequests();
    fetchMissions();
    fetchAnnouncements();
    fetchCloudoMessage();
    fetchArenaMessages();
    setLoading(false);
  };

  const fetchMentors = async () => {
    const { data, error } = await supabase.from("mentors").select("*");
    if (!error && data) {
      setMentors(data);
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load users");
    } else {
      setUsers(data || []);
    }
  };

  const fetchBannedUsers = async () => {
    const { data, error } = await supabase
      .from("user_bans")
      .select("*")
      .order("banned_at", { ascending: false });

    if (error) {
      console.error("Failed to load banned users:", error);
    } else {
      setBannedUsers(data || []);
    }
  };

  const fetchStoreItems = async () => {
    const { data, error } = await supabase
      .from("store_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load store items:", error);
    } else {
      setStoreItems(data || []);
    }
  };

  const fetchTechniques = async () => {
    const { data, error } = await supabase
      .from("techniques")
      .select(`
        *,
        mentor:mentors(name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load techniques:", error);
    } else {
      setTechniques(data || []);
    }
  };

  const fetchMentorRequests = async () => {
    const { data, error } = await supabase
      .from("mentor_change_requests")
      .select(`
        *,
        profile:profiles(username, email),
        current_mentor:mentors!mentor_change_requests_current_mentor_id_fkey(name),
        requested_mentor:mentors!mentor_change_requests_requested_mentor_id_fkey(name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load mentor requests:", error);
    } else {
      setMentorRequests(data || []);
    }
  };

  const fetchMissions = async () => {
    const { data: dataMissionsData } = await supabase
      .from("missions")
      .select("*")
      .eq("type", "data")
      .order("created_at", { ascending: false });
    
    const { data: worldMissionsData } = await supabase
      .from("missions")
      .select(`
        *,
        world_mission_questions(*)
      `)
      .eq("type", "world")
      .order("created_at", { ascending: false });

    if (dataMissionsData) setDataMissions(dataMissionsData);
    if (worldMissionsData) setWorldMissions(worldMissionsData);
  };

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from("admin_announcements")
      .select("*")
      .eq("title", "Site Announcement")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load announcements:", error);
    } else {
      setAnnouncements(data || []);
    }
  };

  const fetchCloudoMessage = async () => {
    const { data, error } = await supabase
      .from("admin_announcements")
      .select("*")
      .eq("title", "CloudO Message")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch CloudO message:", error);
      return;
    }

    if (data) {
      setCurrentCloudoMessage(data);
      setCloudoMessage(data.message);
    }
  };

  const fetchArenaMessages = async () => {
    const { data, error } = await supabase
      .from("arena_admin_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load arena messages:", error);
    } else {
      setArenaMessages(data || []);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.message.trim()) {
      toast.error("Please fill in the message");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("You must be logged in");
      return;
    }

    const { error } = await supabase
      .from("admin_announcements")
      .insert({
        title: "Site Announcement",
        message: newAnnouncement.message,
        admin_id: session.user.id
      });

    if (error) {
      toast.error("Failed to create announcement");
      console.error(error);
    } else {
      toast.success("Announcement created successfully!");
      setNewAnnouncement({ title: "", message: "" });
      fetchAnnouncements();
    }
  };

  const handleSaveCloudoMessage = async () => {
    if (!cloudoMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("You must be logged in");
      return;
    }

    // Delete old CloudO message if exists
    if (currentCloudoMessage) {
      await supabase
        .from("admin_announcements")
        .delete()
        .eq("id", currentCloudoMessage.id);
    }

    // Create new CloudO message
    const { error } = await supabase.from("admin_announcements").insert({
      title: "CloudO Message",
      message: cloudoMessage,
      admin_id: session.user.id,
    });

    if (error) {
      toast.error("Failed to save CloudO message");
      return;
    }

    toast.success("CloudO message saved successfully!");
    fetchCloudoMessage();
  };

  const handleCreateArenaMessage = async () => {
    if (!arenaMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("You must be logged in");
      return;
    }

    const { error } = await supabase
      .from("arena_admin_messages")
      .insert({
        message: arenaMessage,
        admin_id: session.user.id,
        is_active: true
      });

    if (error) {
      toast.error("Failed to create arena message");
      console.error(error);
    } else {
      toast.success("Arena message created successfully!");
      setArenaMessage("");
      fetchArenaMessages();
    }
  };

  const handleToggleArenaMessage = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("arena_admin_messages")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update message status");
    } else {
      toast.success(`Message ${!currentStatus ? "activated" : "deactivated"}`);
      fetchArenaMessages();
    }
  };

  const handleDeleteArenaMessage = async (id: string) => {
    const { error } = await supabase
      .from("arena_admin_messages")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete message");
    } else {
      toast.success("Message deleted successfully!");
      fetchArenaMessages();
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    const { error } = await supabase
      .from("admin_announcements")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete announcement");
    } else {
      toast.success("Announcement deleted");
      fetchAnnouncements();
    }
  };


  const handleAddDataMission = async () => {
    if (!newDataMission.question || newDataMission.options.some(o => !o) || !newDataMission.correct_answer) {
      toast.error("Please fill all fields");
      return;
    }

    const { error } = await supabase.from("missions").insert({
      type: "data",
      question: newDataMission.question,
      options: newDataMission.options,
      correct_answer: newDataMission.correct_answer,
      image_url: newDataMission.image_url || null
    });

    if (error) {
      toast.error("Failed to add mission");
    } else {
      toast.success("Data mission added!");
      setNewDataMission({ question: "", options: ["", "", ""], correct_answer: "", image_url: "" });
      fetchMissions();
    }
  };

  const handleAddWorldMission = async () => {
    const allFilled = newWorldMission.questions.every(q => 
      q.question && q.options.every(o => o) && q.correct_answer
    );
    
    if (!allFilled) {
      toast.error("Please fill all 3 questions with options and correct answers");
      return;
    }

    const { data: mission, error: missionError } = await supabase
      .from("missions")
      .insert({
        type: "world",
        question: newWorldMission.questions[0].question,
        options: newWorldMission.questions[0].options,
        correct_answer: newWorldMission.questions[0].correct_answer,
        image_url: newWorldMission.questions[0].image_url || null
      })
      .select()
      .single();

    if (missionError || !mission) {
      toast.error("Failed to add world mission");
      return;
    }

    const questionsToInsert = newWorldMission.questions.map((q, idx) => ({
      mission_id: mission.id,
      question_order: idx + 1,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      image_url: q.image_url || null
    }));

    const { error: questionsError } = await supabase
      .from("world_mission_questions")
      .insert(questionsToInsert);

    if (questionsError) {
      toast.error("Failed to add mission questions");
    } else {
      toast.success("World mission added!");
      setNewWorldMission({
        questions: [
          { question: "", options: ["", "", ""], correct_answer: "", image_url: "" },
          { question: "", options: ["", "", ""], correct_answer: "", image_url: "" },
          { question: "", options: ["", "", ""], correct_answer: "", image_url: "" }
        ]
      });
      fetchMissions();
    }
  };

  const handleToggleMission = async (missionId: string, isActive: boolean) => {
    const { error } = await supabase
      .from("missions")
      .update({ is_active: !isActive })
      .eq("id", missionId);

    if (error) {
      toast.error("Failed to toggle mission");
    } else {
      toast.success(isActive ? "Mission deactivated" : "Mission activated");
      fetchMissions();
    }
  };

  const handleDeleteMission = async (missionId: string) => {
    const { error } = await supabase
      .from("missions")
      .delete()
      .eq("id", missionId);

    if (error) {
      toast.error("Failed to delete mission");
    } else {
      toast.success("Mission deleted");
      fetchMissions();
    }
  };

  const handleMissionImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: "data" | "world", questionIndex?: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `mission-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("store-items")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Failed to upload image");
      setUploadingImage(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("store-items")
      .getPublicUrl(filePath);

    if (type === "data") {
      setNewDataMission({ ...newDataMission, image_url: publicUrl });
    } else if (questionIndex !== undefined) {
      const updatedQuestions = [...newWorldMission.questions];
      updatedQuestions[questionIndex].image_url = publicUrl;
      setNewWorldMission({ ...newWorldMission, questions: updatedQuestions });
    }

    toast.success("Image uploaded!");
    setUploadingImage(false);
  };

  const handleAddTechnique = async () => {
    if (!newTechnique.name || !newTechnique.mentor_id) {
      toast.error("Name and mentor are required");
      return;
    }

    try {
      const { error } = await supabase.from("techniques").insert({
        name: newTechnique.name,
        description: newTechnique.description,
        type_info: newTechnique.type_info,
        cep: newTechnique.cep,
        price: newTechnique.price,
        level_requirement: newTechnique.level_requirement,
        mentor_id: newTechnique.mentor_id,
        image_url: newTechnique.image_url,
        // New Arena System Fields
        damage: newTechnique.damage || 0,
        armor_damage: newTechnique.armor_damage || 0,
        armor_given: newTechnique.armor_given || 0,
        aura_damage: newTechnique.aura_damage || 0,
        given_aura: newTechnique.given_aura || 0,
        heal: newTechnique.heal || 0,
        tags: newTechnique.tags || [],
        energy_cost: newTechnique.energy_cost || 0,
        energy_given: newTechnique.energy_given || 0,
        cooldown: newTechnique.cooldown || 1,
        opponent_status: newTechnique.opponent_status || null,
        self_status: newTechnique.self_status || null,
        no_hit_m: newTechnique.no_hit_m || null,
        specific_status_hit: newTechnique.specific_status_hit || null,
        mastery_given: newTechnique.mastery_given || 0,
        mastery_taken: newTechnique.mastery_taken || 0,
        no_hit_e: newTechnique.no_hit_e || null,
        no_use_e: newTechnique.no_use_e || null,
        no_use_m: newTechnique.no_use_m || null,
        atk_boost: newTechnique.atk_boost || 0,
        atk_debuff: newTechnique.atk_debuff || 0,
      });

      if (error) throw error;

      toast.success("Technique added successfully");
      setNewTechnique({
        name: "",
        description: "",
        type_info: "",
        cep: "",
        price: 0,
        level_requirement: 1,
        mentor_id: "",
        image_url: "",
        damage: 0,
        armor_damage: 0,
        armor_given: 0,
        aura_damage: 0,
        given_aura: 0,
        heal: 0,
        tags: [],
        energy_cost: 0,
        energy_given: 0,
        cooldown: 1,
        opponent_status: null,
        self_status: null,
        no_hit_m: null,
        specific_status_hit: null,
        mastery_given: 0,
        mastery_taken: 0,
        no_hit_e: null,
        no_use_e: null,
        no_use_m: null,
        atk_boost: 0,
        atk_debuff: 0,
      });
      fetchTechniques();
    } catch (error: any) {
      toast.error("Failed to add technique: " + error.message);
    }
  };

  const handleUpdateTechnique = async () => {
    if (!editingTechnique) return;

    try {
      const { error } = await supabase
        .from("techniques")
        .update({
          name: editingTechnique.name,
          description: editingTechnique.description,
          type_info: editingTechnique.type_info,
          cep: editingTechnique.cep,
          price: editingTechnique.price,
          level_requirement: editingTechnique.level_requirement,
          mentor_id: editingTechnique.mentor_id,
          image_url: editingTechnique.image_url,
          // New Arena System Fields
          damage: editingTechnique.damage || 0,
          armor_damage: editingTechnique.armor_damage || 0,
          armor_given: editingTechnique.armor_given || 0,
          aura_damage: editingTechnique.aura_damage || 0,
          given_aura: editingTechnique.given_aura || 0,
          heal: editingTechnique.heal || 0,
          tags: editingTechnique.tags || [],
          energy_cost: editingTechnique.energy_cost || 0,
          energy_given: editingTechnique.energy_given || 0,
          cooldown: editingTechnique.cooldown || 1,
          opponent_status: editingTechnique.opponent_status || null,
          self_status: editingTechnique.self_status || null,
          no_hit_m: editingTechnique.no_hit_m || null,
          specific_status_hit: editingTechnique.specific_status_hit || null,
          mastery_given: editingTechnique.mastery_given || 0,
          mastery_taken: editingTechnique.mastery_taken || 0,
          no_hit_e: editingTechnique.no_hit_e || null,
          no_use_e: editingTechnique.no_use_e || null,
          no_use_m: editingTechnique.no_use_m || null,
          atk_boost: editingTechnique.atk_boost || 0,
          atk_debuff: editingTechnique.atk_debuff || 0,
        })
        .eq("id", editingTechnique.id);

      if (error) throw error;

      toast.success("Technique updated successfully");
      setEditingTechnique(null);
      fetchTechniques();
    } catch (error: any) {
      toast.error("Failed to update technique: " + error.message);
    }
  };

  const handleDeleteTechnique = async (id: string) => {
    if (!confirm("Are you sure you want to delete this technique?")) return;

    try {
      const { error } = await supabase.from("techniques").delete().eq("id", id);
      if (error) throw error;

      toast.success("Technique deleted successfully");
      fetchTechniques();
    } catch (error: any) {
      toast.error("Failed to delete technique: " + error.message);
    }
  };

  const handleAddMentor = async () => {
    if (!newMentor.name || !newMentor.image_url) {
      toast.error("Name and image are required");
      return;
    }

    try {
      const { error } = await supabase.from("mentors").insert({
        name: newMentor.name,
        description: newMentor.description,
        image_url: newMentor.image_url
      });

      if (error) throw error;

      toast.success("Mentor added successfully");
      setNewMentor({
        name: "",
        description: "",
        image_url: ""
      });
      fetchMentors();
    } catch (error: any) {
      toast.error("Failed to add mentor: " + error.message);
    }
  };

  const handleUpdateMentor = async () => {
    if (!editingMentor) return;

    try {
      const { error } = await supabase
        .from("mentors")
        .update({
          name: editingMentor.name,
          description: editingMentor.description,
          image_url: editingMentor.image_url
        })
        .eq("id", editingMentor.id);

      if (error) throw error;

      toast.success("Mentor updated successfully");
      setEditingMentor(null);
      fetchMentors();
    } catch (error: any) {
      toast.error("Failed to update mentor: " + error.message);
    }
  };

  const handleDeleteMentor = async (id: string) => {
    if (!confirm("Are you sure you want to delete this mentor?")) return;

    try {
      const { error } = await supabase.from("mentors").delete().eq("id", id);
      if (error) throw error;

      toast.success("Mentor deleted successfully");
      fetchMentors();
    } catch (error: any) {
      toast.error("Failed to delete mentor: " + error.message);
    }
  };

  const handleTechniqueImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('store-items')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('store-items')
        .getPublicUrl(filePath);

      if (isEditing && editingTechnique) {
        setEditingTechnique({ ...editingTechnique, image_url: publicUrl });
      } else {
        setNewTechnique({ ...newTechnique, image_url: publicUrl });
      }

      toast.success("Image uploaded successfully");
    } catch (error: any) {
      toast.error("Failed to upload image: " + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleMentorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('store-items')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('store-items')
        .getPublicUrl(filePath);

      if (isEditing && editingMentor) {
        setEditingMentor({ ...editingMentor, image_url: publicUrl });
      } else {
        setNewMentor({ ...newMentor, image_url: publicUrl });
      }

      toast.success("Image uploaded successfully");
    } catch (error: any) {
      toast.error("Failed to upload image: " + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleBanUser = async () => {
    if (!banReason.trim() || !userToBan) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("user_bans")
      .insert({
        user_id: userToBan.id,
        banned_by: user?.id,
        reason: banReason
      });

    if (error) {
      toast.error("Failed to ban user");
    } else {
      toast.success("User banned successfully");
      setBanReason("");
      setUserToBan(null);
      fetchBannedUsers();
    }
  };

  const handleUnbanUser = async (banId: string) => {
    const { error } = await supabase
      .from("user_bans")
      .delete()
      .eq("id", banId);

    if (error) {
      toast.error("Failed to unban user");
    } else {
      toast.success("User unbanned successfully");
      fetchBannedUsers();
    }
  };

  const handleSendGlobalMessage = async () => {
    if (!globalMessage.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("global_chat_messages")
      .insert({
        user_id: user?.id,
        message: `📢 ADMIN: ${globalMessage}`
      });

    if (error) {
      toast.error("Failed to send message");
    } else {
      toast.success("Global message sent!");
      setGlobalMessage("");
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploadingImage(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError, data } = await supabase.storage
        .from('store-items')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('store-items')
        .getPublicUrl(filePath);

      setNewStoreItem({ ...newStoreItem, image_url: publicUrl });
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddStoreItem = async () => {
    if (!newStoreItem.name || newStoreItem.price < 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    const { error } = await supabase
      .from("store_items")
      .insert({
        ...newStoreItem,
        mentor_id: newStoreItem.mentor_id || null
      });

    if (error) {
      toast.error("Failed to add store item");
    } else {
      toast.success("Store item added successfully!");
      setNewStoreItem({
        name: "",
        description: "",
        type: "title",
        price: 0,
        image_url: "",
        level_requirement: 1,
        mentor_id: ""
      });
      fetchStoreItems();
    }
  };

  const handleDeleteStoreItem = async (itemId: string) => {
    const { error } = await supabase
      .from("store_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      toast.error("Failed to delete item");
    } else {
      toast.success("Item deleted");
      fetchStoreItems();
    }
  };

  const handleEditStoreItem = (item: any) => {
    setEditingStoreItem(item);
    setNewStoreItem({
      name: item.name,
      description: item.description || "",
      type: item.type,
      price: item.price,
      image_url: item.image_url || "",
      level_requirement: item.level_requirement || 1,
      mentor_id: item.mentor_id || ""
    });
  };

  const handleUpdateStoreItem = async () => {
    if (!newStoreItem.name || newStoreItem.price < 0 || !editingStoreItem) {
      toast.error("Please fill in all required fields");
      return;
    }

    const { error } = await supabase
      .from("store_items")
      .update({
        ...newStoreItem,
        mentor_id: newStoreItem.mentor_id || null
      })
      .eq("id", editingStoreItem.id);

    if (error) {
      toast.error("Failed to update store item");
    } else {
      toast.success("Store item updated successfully!");
      setNewStoreItem({
        name: "",
        description: "",
        type: "title",
        price: 0,
        image_url: "",
        level_requirement: 1,
        mentor_id: ""
      });
      setEditingStoreItem(null);
      fetchStoreItems();
    }
  };

  const handleCancelEdit = () => {
    setEditingStoreItem(null);
    setNewStoreItem({
      name: "",
      description: "",
      type: "title",
      price: 0,
      image_url: "",
      level_requirement: 1,
      mentor_id: ""
    });
  };

  const handleEditUser = async (user: any) => {
    setSelectedUser(user);
    setEditForm({
      username: user.username,
      xp_points: user.xp_points,
      tokens: user.tokens,
      discipline: user.discipline,
      admin_note: user.admin_note || "",
      mentor1: "",
      mentor2: "",
    });

    // Fetch user mentors
    const { data: mentorData } = await supabase
      .from("user_mentors")
      .select("mentor_id, slot")
      .eq("user_id", user.id)
      .order("slot");

    if (mentorData) {
      setUserMentors(mentorData);
      setEditForm(prev => ({
        ...prev,
        mentor1: mentorData.find(m => m.slot === 1)?.mentor_id || "",
        mentor2: mentorData.find(m => m.slot === 2)?.mentor_id || "",
      }));
    }
  };

  const handleSaveUser = async () => {
    const validation = adminUserSchema.safeParse(editForm);
    
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    const newLevel = Math.floor(validation.data.xp_points / 200) + 1;

    const { error } = await supabase
      .from("profiles")
      .update({
        username: validation.data.username,
        xp_points: validation.data.xp_points,
        tokens: validation.data.tokens,
        level: newLevel,
        discipline: validation.data.discipline as any,
        admin_note: validation.data.admin_note,
      })
      .eq("id", selectedUser.id);

    if (error) {
      toast.error("Failed to update user");
      return;
    }

    // Update mentors if changed
    if (editForm.mentor1 && editForm.mentor2 && editForm.mentor1 !== editForm.mentor2) {
      // Delete existing mentors
      await supabase
        .from("user_mentors")
        .delete()
        .eq("user_id", selectedUser.id);

      // Insert new mentors
      const { error: mentorError } = await supabase
        .from("user_mentors")
        .insert([
          { user_id: selectedUser.id, mentor_id: editForm.mentor1, slot: 1 },
          { user_id: selectedUser.id, mentor_id: editForm.mentor2, slot: 2 },
        ]);

      if (mentorError) {
        toast.error("Failed to update mentors");
        return;
      }

      // Fetch the new mentor to update profile picture
      const { data: newMentor } = await supabase
        .from("mentors")
        .select("*")
        .eq("id", editForm.mentor1)
        .single();

      if (newMentor) {
        const { mapMentorToProfileId } = await import("@/lib/profileImageResolver");
        const profileId = mapMentorToProfileId(newMentor);
        
        if (profileId) {
          await supabase
            .from("profiles")
            .update({ profile_picture_url: `profile:${profileId}` })
            .eq("id", selectedUser.id);
        }
      }
    }

    toast.success("User updated successfully!");
    setSelectedUser(null);
    fetchUsers();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <img src={logo} alt="ShonenCloud" className="w-24 h-24 mx-auto animate-pulse" />
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img src={logo} alt="ShonenCloud" className="h-12 cursor-pointer" onClick={() => navigate("/dashboard")} />
          <button onClick={() => navigate("/dashboard")} className="transition-transform hover:scale-105 cursor-pointer">
            <img src={homeButton} alt="Home" className="h-12" />
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-10 gap-1">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="announcements">
              <Megaphone className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Announcements</span>
              <span className="md:hidden">News</span>
            </TabsTrigger>
            <TabsTrigger value="cloudo">
              <Megaphone className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">CloudO</span>
              <span className="md:hidden">CloudO</span>
            </TabsTrigger>
            <TabsTrigger value="arena">
              <Megaphone className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Arena</span>
              <span className="md:hidden">Arena</span>
            </TabsTrigger>
            <TabsTrigger value="chat">Chat & Bans</TabsTrigger>
            <TabsTrigger value="store">Store</TabsTrigger>
            <TabsTrigger value="techniques">Techniques</TabsTrigger>
            <TabsTrigger value="mentors">Mentors</TabsTrigger>
            <TabsTrigger value="requests">
              <span className="hidden md:inline">Mentor Requests</span>
              <span className="md:hidden">Requests</span>
            </TabsTrigger>
            <TabsTrigger value="missions">Missions</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
            <div className="space-y-4">
              {users.map((user) => {
                const isBanned = bannedUsers.some(ban => ban.user_id === user.id);
                
                return (
                <div key={user.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-bold">{user.username}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs">Level {user.level} | {user.xp_points} XP | {user.tokens} Tokens | {user.discipline}</p>
                    {isBanned && <Badge variant="destructive" className="mt-1">BANNED</Badge>}
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button onClick={() => handleEditUser(user)} size="sm">Edit</Button>
                      </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit User: {user.username}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Username</Label>
                          <Input
                            value={editForm.username}
                            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>XP Points</Label>
                          <Input
                            type="number"
                            value={editForm.xp_points}
                            onChange={(e) => setEditForm({ ...editForm, xp_points: parseInt(e.target.value) || 0 })}
                            min={0}
                            max={1000000}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Range: 0 - 1,000,000
                          </p>
                        </div>
                        <div>
                          <Label>Tokens</Label>
                          <Input
                            type="number"
                            value={editForm.tokens}
                            onChange={(e) => setEditForm({ ...editForm, tokens: parseInt(e.target.value) || 0 })}
                            min={0}
                            max={100000}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Range: 0 - 100,000
                          </p>
                        </div>
                        <div>
                          <Label>Discipline</Label>
                          <Select value={editForm.discipline} onValueChange={(value) => setEditForm({ ...editForm, discipline: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DISCIPLINES.map((d) => (
                                <SelectItem key={d} value={d}>{d}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Admin Note</Label>
                          <Textarea
                            value={editForm.admin_note}
                            onChange={(e) => setEditForm({ ...editForm, admin_note: e.target.value })}
                            placeholder="Add a note visible on user's profile"
                          />
                          <p className={`text-xs mt-1 ${editForm.admin_note.length > 500 ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                            {editForm.admin_note.length} / 500 characters
                          </p>
                        </div>
                        <div>
                          <Label>Mentors</Label>
                          <p className="text-xs text-muted-foreground mb-2">Select 2 different mentors</p>
                          <div className="grid grid-cols-2 gap-2">
                            <Select 
                              value={editForm.mentor1} 
                              onValueChange={(value) => setEditForm({ ...editForm, mentor1: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Mentor 1" />
                              </SelectTrigger>
                              <SelectContent>
                                {mentors.map((m) => (
                                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select 
                              value={editForm.mentor2} 
                              onValueChange={(value) => setEditForm({ ...editForm, mentor2: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Mentor 2" />
                              </SelectTrigger>
                              <SelectContent>
                                {mentors.map((m) => (
                                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button onClick={handleSaveUser} className="w-full">Save Changes</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {!isBanned ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => setUserToBan(user)}
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Ban
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Ban User: {user.username}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Reason for ban</Label>
                            <Textarea
                              value={banReason}
                              onChange={(e) => setBanReason(e.target.value)}
                              placeholder="Enter the reason for banning this user..."
                            />
                          </div>
                          <Button 
                            onClick={handleBanUser} 
                            variant="destructive"
                            className="w-full"
                            disabled={!banReason.trim()}
                          >
                            Confirm Ban
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const ban = bannedUsers.find(b => b.user_id === user.id);
                        if (ban) handleUnbanUser(ban.id);
                      }}
                    >
                      Unban
                    </Button>
                  )}
                  </div>
                </div>
              );
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="announcements">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Announcement Management
            </CardTitle>
            <CardDescription>
              Create rich announcements for the site (supports images and formatting)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Create New Announcement */}
            <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
              <h3 className="font-semibold text-lg">Create Site Announcement</h3>
              
              <div>
                <Label htmlFor="announcement-message">Message (supports rich text, images, and formatting)</Label>
                <RichTextEditor
                  content={newAnnouncement.message}
                  onChange={(content) => setNewAnnouncement({ ...newAnnouncement, message: content })}
                  placeholder="Write your announcement message here..."
                />
              </div>

              <Button onClick={handleCreateAnnouncement} className="w-full">
                <Megaphone className="mr-2 h-4 w-4" />
                Create Announcement
              </Button>
            </div>

            {/* Existing Announcements */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Existing Announcements</h3>
              
              {announcements.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No announcements yet</p>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <Card key={announcement.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">Site Announcement</CardTitle>
                            <CardDescription>
                              Created {new Date(announcement.created_at).toLocaleDateString()} at{" "}
                              {new Date(announcement.created_at).toLocaleTimeString()}
                            </CardDescription>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div 
                          className="prose prose-sm max-w-none dark:prose-invert border rounded-lg p-4 bg-background"
                          dangerouslySetInnerHTML={{ __html: announcement.message }}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="cloudo">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              CloudO Message
            </CardTitle>
            <CardDescription>
              Simple message for CloudO popup (plain text only, no images or formatting)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cloudo-message">Message</Label>
              <Textarea
                id="cloudo-message"
                value={cloudoMessage}
                onChange={(e) => setCloudoMessage(e.target.value)}
                placeholder="Enter a simple message for CloudO..."
                rows={8}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This message appears in the CloudO dialog on the welcome and signup pages. Keep it simple and friendly!
              </p>
            </div>
            <Button onClick={handleSaveCloudoMessage} className="w-full">
              Save CloudO Message
            </Button>
            {currentCloudoMessage && (
              <p className="text-sm text-muted-foreground text-center">
                Last updated: {new Date(currentCloudoMessage.created_at).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="arena">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Arena Admin Messages
            </CardTitle>
            <CardDescription>
              Create and manage admin messages that appear in the Arena. Supports rich text formatting.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Create New Arena Message</Label>
              <RichTextEditor
                content={arenaMessage}
                onChange={setArenaMessage}
                placeholder="Enter your arena message with rich formatting..."
              />
              <Button onClick={handleCreateArenaMessage} className="w-full">
                Create Arena Message
              </Button>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Existing Arena Messages</h3>
              {arenaMessages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No arena messages yet. Create one above!
                </p>
              ) : (
                <div className="space-y-4">
                  {arenaMessages.map((msg) => (
                    <Card key={msg.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">
                            {new Date(msg.created_at).toLocaleDateString()}
                          </CardTitle>
                          <div className="flex gap-2">
                            <Badge variant={msg.is_active ? "default" : "secondary"}>
                              {msg.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              size="sm"
                              variant={msg.is_active ? "outline" : "default"}
                              onClick={() => handleToggleArenaMessage(msg.id, msg.is_active)}
                            >
                              {msg.is_active ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteArenaMessage(msg.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div 
                          className="prose prose-sm max-w-none dark:prose-invert border rounded-lg p-4 bg-background"
                          dangerouslySetInnerHTML={{ __html: msg.message }}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="chat">
        <Card>
          <CardHeader>
            <CardTitle>Chat Management & User Bans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Send Global Message</Label>
              <div className="flex gap-2">
                <Input
                  value={globalMessage}
                  onChange={(e) => setGlobalMessage(e.target.value)}
                  placeholder="Type announcement..."
                />
                <Button onClick={handleSendGlobalMessage}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Send
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Banned Users</h3>
              <div className="space-y-2">
                {bannedUsers.map((ban: any) => {
                  const bannedProfile = users.find((u) => u.id === ban.user_id);
                  return (
                    <div key={ban.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{bannedProfile?.username || "Unknown user"}</p>
                        <p className="text-sm text-muted-foreground">{ban.reason}</p>
                      </div>
                      <Button variant="outline" onClick={() => handleUnbanUser(ban.id)}>
                        Unban
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="store">
        <Card>
          <CardHeader>
            <CardTitle>Store Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Item Name</Label>
                <Input
                  value={newStoreItem.name}
                  onChange={(e) => setNewStoreItem({...newStoreItem, name: e.target.value})}
                />
              </div>
              <div>
                <Label>Price (tokens)</Label>
                <Input
                  type="number"
                  value={newStoreItem.price}
                  onChange={(e) => setNewStoreItem({...newStoreItem, price: parseInt(e.target.value)})}
                />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={newStoreItem.description}
                  onChange={(e) => setNewStoreItem({...newStoreItem, description: e.target.value})}
                  placeholder="Enter item description..."
                />
              </div>
              <div>
                <Label>Level Requirement</Label>
                <Input
                  type="number"
                  min="1"
                  value={newStoreItem.level_requirement}
                  onChange={(e) => setNewStoreItem({...newStoreItem, level_requirement: parseInt(e.target.value) || 1})}
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={newStoreItem.type} onValueChange={(val) => setNewStoreItem({...newStoreItem, type: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="profile_picture">Profile Picture</SelectItem>
                    <SelectItem value="technique">Technique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Item Image</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      disabled={uploadingImage}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploadingImage ? "Uploading..." : "Upload Image"}
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground text-center">or</div>
                  <Input
                    placeholder="Enter image URL"
                    value={newStoreItem.image_url}
                    onChange={(e) => setNewStoreItem({...newStoreItem, image_url: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label>Mentor Requirement</Label>
                <Select 
                  value={newStoreItem.mentor_id} 
                  onValueChange={(val) => setNewStoreItem({...newStoreItem, mentor_id: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a mentor" />
                  </SelectTrigger>
                  <SelectContent>
                    {mentors.map((mentor) => (
                      <SelectItem key={mentor.id} value={mentor.id}>
                        {mentor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Preview Section */}
            <div className="mt-6 pt-6 border-t">
              <Label className="text-lg font-semibold mb-4 block">Preview</Label>
              <div className="max-w-sm">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle>{newStoreItem.name || "Item Name"}</CardTitle>
                      <Badge variant="secondary">{newStoreItem.type.replace('_', ' ')}</Badge>
                    </div>
                    <CardDescription>
                      {newStoreItem.description || "No description provided"}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {newStoreItem.level_requirement > 1 && (
                          <Badge variant="outline">Level {newStoreItem.level_requirement} required</Badge>
                        )}
                        {newStoreItem.mentor_id && (
                          <Badge variant="secondary">
                            Requires {mentors.find(m => m.id === newStoreItem.mentor_id)?.name || "Mentor"}
                          </Badge>
                        )}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  {newStoreItem.image_url && (
                    <CardContent>
                      <img
                        src={newStoreItem.image_url}
                        alt={newStoreItem.name}
                        className="w-full h-48 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/400x300?text=Invalid+Image+URL";
                        }}
                      />
                    </CardContent>
                  )}
                  <CardFooter className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-primary" />
                      <span className="font-bold text-lg">{newStoreItem.price || 0}</span>
                    </div>
                    <Button disabled>Purchase</Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
            
            <div className="flex gap-2">
              {editingStoreItem ? (
                <>
                  <Button onClick={handleUpdateStoreItem}>Update Item</Button>
                  <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                </>
              ) : (
                <Button onClick={handleAddStoreItem}>Add Store Item</Button>
              )}
            </div>
            
            <div className="space-y-2 mt-4">
              {storeItems.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm">{item.type} - {item.price} tokens - Level {item.level_requirement} required{item.mentor_id ? ` - Requires mentor` : ''}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleEditStoreItem(item)}>
                      Edit
                    </Button>
                    <Button variant="destructive" onClick={() => handleDeleteStoreItem(item.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Techniques Tab */}
      <TabsContent value="techniques">
        <Card>
          <CardHeader>
            <CardTitle>Techniques Management</CardTitle>
            <CardDescription>Add and manage techniques for mentors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add New Technique Form */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-lg">Add New Technique</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Technique Name</Label>
                  <Input
                    value={newTechnique.name}
                    onChange={(e) => setNewTechnique({...newTechnique, name: e.target.value})}
                    placeholder="e.g., Shadow Clone Jutsu"
                  />
                </div>
                <div>
                  <Label>Mentor</Label>
                  <Select value={newTechnique.mentor_id} onValueChange={(val) => setNewTechnique({...newTechnique, mentor_id: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mentor" />
                    </SelectTrigger>
                    <SelectContent>
                      {mentors.map((mentor: any) => (
                        <SelectItem key={mentor.id} value={mentor.id}>{mentor.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newTechnique.description}
                    onChange={(e) => setNewTechnique({...newTechnique, description: e.target.value})}
                    placeholder="Describe the technique..."
                  />
                </div>
                <div>
                  <Label>Type/Category</Label>
                  <Input
                    value={newTechnique.type_info}
                    onChange={(e) => setNewTechnique({...newTechnique, type_info: e.target.value})}
                    placeholder="e.g., Ninjutsu, Offensive"
                  />
                </div>
                <div>
                  <Label>CEP</Label>
                  <Input
                    value={newTechnique.cep}
                    onChange={(e) => setNewTechnique({...newTechnique, cep: e.target.value})}
                    placeholder="e.g., C-rank"
                  />
                </div>
                <div>
                  <Label>Level Requirement</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newTechnique.level_requirement}
                    onChange={(e) => setNewTechnique({...newTechnique, level_requirement: parseInt(e.target.value) || 1})}
                  />
                </div>
                <div>
                  <Label>Price (tokens)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newTechnique.price}
                    onChange={(e) => setNewTechnique({...newTechnique, price: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Technique Image</Label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleTechniqueImageUpload(e, false)}
                      disabled={uploadingImage}
                    />
                    {newTechnique.image_url && (
                      <img src={newTechnique.image_url} alt="Preview" className="h-10 w-10 rounded object-cover" />
                    )}
                  </div>
                </div>
                
                {/* New Arena System Fields */}
                <div className="col-span-2 border-t pt-4 mt-4">
                  <h4 className="font-semibold mb-3">Arena System Fields</h4>
                </div>
                
                {/* Damage Fields */}
                <div>
                  <Label>Damage</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newTechnique.damage}
                    onChange={(e) => setNewTechnique({...newTechnique, damage: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Armor Damage</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newTechnique.armor_damage}
                    onChange={(e) => setNewTechnique({...newTechnique, armor_damage: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Armor Given</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newTechnique.armor_given}
                    onChange={(e) => setNewTechnique({...newTechnique, armor_given: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Aura Damage</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newTechnique.aura_damage}
                    onChange={(e) => setNewTechnique({...newTechnique, aura_damage: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Given Aura</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newTechnique.given_aura}
                    onChange={(e) => setNewTechnique({...newTechnique, given_aura: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Heal</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newTechnique.heal}
                    onChange={(e) => setNewTechnique({...newTechnique, heal: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                
                {/* Tags */}
                <div className="col-span-2">
                  <Label>Tags (Multi-select)</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {["Dice", "Setup", "Physical", "Ranged", "Mental", "Aoe", "Elemental", "Buff", "Debuff", "Movement", "Defensive", "Offensive", "Melee", "Global", "Combo", "Power", "Revival"].map((tag) => (
                      <div key={tag} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tag-${tag}`}
                          checked={newTechnique.tags.includes(tag)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewTechnique({...newTechnique, tags: [...newTechnique.tags, tag]});
                            } else {
                              setNewTechnique({...newTechnique, tags: newTechnique.tags.filter(t => t !== tag)});
                            }
                          }}
                        />
                        <Label htmlFor={`tag-${tag}`} className="text-sm font-normal cursor-pointer">{tag}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Energy Fields */}
                <div>
                  <Label>Energy Cost (1-20)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    value={newTechnique.energy_cost}
                    onChange={(e) => setNewTechnique({...newTechnique, energy_cost: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Energy Given (1-20)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    value={newTechnique.energy_given}
                    onChange={(e) => setNewTechnique({...newTechnique, energy_given: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                
                {/* Cooldown */}
                <div>
                  <Label>Cooldown (1-7 minutes)</Label>
                  <Select value={newTechnique.cooldown.toString()} onValueChange={(val) => setNewTechnique({...newTechnique, cooldown: parseInt(val)})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                        <SelectItem key={num} value={num.toString()}>{num} minute{num > 1 ? 's' : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Status Fields */}
                <div>
                  <Label>Opponent Status</Label>
                  <Select value={newTechnique.opponent_status || ""} onValueChange={(val) => setNewTechnique({...newTechnique, opponent_status: val || null})}>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {["Stunned", "Hidden", "Shielded", "Weakened", "Lethal", "Grounded", "Reaping", "Unwell", "Focused", "Airborne", "Underground", "Silenced", "Stasis", "K.O", "Element-affected", "Launched Up", "Shrouded", "Analyzed", "Blessed", "Bleeding", "Chaos-affected", "Exploring"].map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Self Status</Label>
                  <Select value={newTechnique.self_status || ""} onValueChange={(val) => setNewTechnique({...newTechnique, self_status: val || null})}>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {["Stunned", "Hidden", "Shielded", "Weakened", "Lethal", "Grounded", "Reaping", "Unwell", "Focused", "Airborne", "Underground", "Silenced", "Stasis", "K.O", "Element-affected", "Launched Up", "Shrouded", "Analyzed", "Blessed", "Bleeding", "Chaos-affected", "Exploring"].map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Mastery Fields */}
                <div>
                  <Label>Mastery Given</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.25"
                    value={newTechnique.mastery_given}
                    onChange={(e) => setNewTechnique({...newTechnique, mastery_given: parseFloat(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Mastery Taken</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.25"
                    value={newTechnique.mastery_taken}
                    onChange={(e) => setNewTechnique({...newTechnique, mastery_taken: parseFloat(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                
                {/* No Hit Fields */}
                <div>
                  <Label>No Hit Mastery (1-6)</Label>
                  <Select value={newTechnique.no_hit_m?.toString() || ""} onValueChange={(val) => setNewTechnique({...newTechnique, no_hit_m: val ? parseInt(val) : null})}>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>No Hit Energy</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newTechnique.no_hit_e || ""}
                    onChange={(e) => setNewTechnique({...newTechnique, no_hit_e: e.target.value ? parseInt(e.target.value) : null})}
                    placeholder="None"
                  />
                </div>
                
                {/* Specific Status Hit */}
                <div>
                  <Label>Specific Status Hit</Label>
                  <Select value={newTechnique.specific_status_hit || ""} onValueChange={(val) => setNewTechnique({...newTechnique, specific_status_hit: val || null})}>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {["Stunned", "Hidden", "Shielded", "Weakened", "Lethal", "Grounded", "Reaping", "Unwell", "Focused", "Airborne", "Underground", "Silenced", "Stasis", "K.O", "Element-affected", "Launched Up", "Shrouded", "Analyzed", "Blessed", "Bleeding", "Chaos-affected", "Exploring"].map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* No Use Fields */}
                <div>
                  <Label>No Use Energy</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newTechnique.no_use_e || ""}
                    onChange={(e) => setNewTechnique({...newTechnique, no_use_e: e.target.value ? parseInt(e.target.value) : null})}
                    placeholder="None"
                  />
                </div>
                <div>
                  <Label>No Use Mastery</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newTechnique.no_use_m || ""}
                    onChange={(e) => setNewTechnique({...newTechnique, no_use_m: e.target.value ? parseInt(e.target.value) : null})}
                    placeholder="None"
                  />
                </div>
                
                {/* ATK Fields */}
                <div>
                  <Label>ATK Boost</Label>
                  <Input
                    type="number"
                    value={newTechnique.atk_boost}
                    onChange={(e) => setNewTechnique({...newTechnique, atk_boost: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>ATK Debuff</Label>
                  <Input
                    type="number"
                    value={newTechnique.atk_debuff}
                    onChange={(e) => setNewTechnique({...newTechnique, atk_debuff: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
              </div>
              <Button onClick={handleAddTechnique} disabled={uploadingImage}>
                Add Technique
              </Button>
            </div>

            {/* Existing Techniques */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Existing Techniques</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {techniques.map((tech: any) => (
                  <Card key={tech.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{tech.name}</CardTitle>
                          <CardDescription>{tech.mentor?.name}</CardDescription>
                        </div>
                        {tech.image_url && (
                          <img src={tech.image_url} alt={tech.name} className="h-12 w-12 rounded object-cover" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm">{tech.description}</p>
                      <div className="flex gap-2 flex-wrap">
                        <Badge>{tech.cep}</Badge>
                        <Badge variant="outline">{tech.type_info}</Badge>
                        <Badge variant="outline">Level {tech.level_requirement}</Badge>
                        <Badge variant="outline">{tech.price} tokens</Badge>
                      </div>
                    </CardContent>
                    <CardFooter className="gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setEditingTechnique(tech)}>
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Technique</DialogTitle>
                          </DialogHeader>
                          {editingTechnique && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Name</Label>
                                  <Input
                                    value={editingTechnique.name}
                                    onChange={(e) => setEditingTechnique({...editingTechnique, name: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Mentor</Label>
                                  <Select value={editingTechnique.mentor_id} onValueChange={(val) => setEditingTechnique({...editingTechnique, mentor_id: val})}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {mentors.map((mentor: any) => (
                                        <SelectItem key={mentor.id} value={mentor.id}>{mentor.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="col-span-2">
                                  <Label>Description</Label>
                                  <Textarea
                                    value={editingTechnique.description}
                                    onChange={(e) => setEditingTechnique({...editingTechnique, description: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Type</Label>
                                  <Input
                                    value={editingTechnique.type_info}
                                    onChange={(e) => setEditingTechnique({...editingTechnique, type_info: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>CEP</Label>
                                  <Input
                                    value={editingTechnique.cep}
                                    onChange={(e) => setEditingTechnique({...editingTechnique, cep: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Level Requirement</Label>
                                  <Input
                                    type="number"
                                    value={editingTechnique.level_requirement}
                                    onChange={(e) => setEditingTechnique({...editingTechnique, level_requirement: parseInt(e.target.value)})}
                                  />
                                </div>
                                <div>
                                  <Label>Price</Label>
                                  <Input
                                    type="number"
                                    value={editingTechnique.price}
                                    onChange={(e) => setEditingTechnique({...editingTechnique, price: parseInt(e.target.value)})}
                                  />
                                </div>
                                <div className="col-span-2">
                                  <Label>Image</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleTechniqueImageUpload(e, true)}
                                      disabled={uploadingImage}
                                    />
                                    {editingTechnique.image_url && (
                                      <img src={editingTechnique.image_url} alt="Preview" className="h-10 w-10 rounded object-cover" />
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={handleUpdateTechnique}>Save Changes</Button>
                                <Button variant="outline" onClick={() => setEditingTechnique(null)}>Cancel</Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteTechnique(tech.id)}>
                        Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              {techniques.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No techniques yet. Add your first technique above!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Mentors Tab */}
      <TabsContent value="mentors">
        <Card>
          <CardHeader>
            <CardTitle>Mentors Management</CardTitle>
            <CardDescription>Add and manage all mentors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add New Mentor Form */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-lg">Add New Mentor</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mentor Name</Label>
                  <Input
                    value={newMentor.name}
                    onChange={(e) => setNewMentor({...newMentor, name: e.target.value})}
                    placeholder="e.g., Kakashi Hatake"
                  />
                </div>
                <div>
                  <Label>Mentor Image (Required)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleMentorImageUpload(e, false)}
                      disabled={uploadingImage}
                    />
                    {newMentor.image_url && (
                      <img src={newMentor.image_url} alt="Preview" className="h-10 w-10 rounded-full object-cover" />
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newMentor.description}
                    onChange={(e) => setNewMentor({...newMentor, description: e.target.value})}
                    placeholder="Describe the mentor's background and abilities..."
                  />
                </div>
              </div>
              <Button onClick={handleAddMentor} disabled={uploadingImage || !newMentor.name || !newMentor.image_url}>
                Add Mentor
              </Button>
            </div>

            {/* Existing Mentors */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Existing Mentors</h3>
              <div className="grid gap-4 md:grid-cols-3">
                {mentors.map((mentor: any) => (
                  <Card key={mentor.id}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <img 
                          src={mentor.image_url} 
                          alt={mentor.name}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                        <div>
                          <CardTitle className="text-lg">{mentor.name}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{mentor.description}</p>
                    </CardContent>
                    <CardFooter className="gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setEditingMentor(mentor)}>
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Mentor</DialogTitle>
                          </DialogHeader>
                          {editingMentor && (
                            <div className="space-y-4">
                              <div>
                                <Label>Name</Label>
                                <Input
                                  value={editingMentor.name}
                                  onChange={(e) => setEditingMentor({...editingMentor, name: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label>Description</Label>
                                <Textarea
                                  value={editingMentor.description}
                                  onChange={(e) => setEditingMentor({...editingMentor, description: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label>Image</Label>
                                <div className="flex gap-2 items-center">
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleMentorImageUpload(e, true)}
                                    disabled={uploadingImage}
                                  />
                                  {editingMentor.image_url && (
                                    <img src={editingMentor.image_url} alt="Preview" className="h-12 w-12 rounded-full object-cover" />
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={handleUpdateMentor}>Save Changes</Button>
                                <Button variant="outline" onClick={() => setEditingMentor(null)}>Cancel</Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteMentor(mentor.id)}>
                        Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              {mentors.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No mentors yet. Add your first mentor above!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Mentor Change Requests Tab */}
      <TabsContent value="requests">
        <Card>
          <CardHeader>
            <CardTitle>Mentor Change Requests</CardTitle>
            <CardDescription>Approve or reject mentor change requests from users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mentorRequests.filter((req: any) => req.status === 'pending').map((request: any) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{request.profile?.username}</CardTitle>
                        <CardDescription>{request.profile?.email}</CardDescription>
                      </div>
                      <Badge>Pending</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Slot {request.slot}</p>
                        <p className="text-muted-foreground">
                          From: {request.current_mentor?.name || "Empty"}
                        </p>
                        <p className="text-muted-foreground">
                          To: {request.requested_mentor?.name}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Cost</p>
                        <p className="text-muted-foreground">{request.token_cost} tokens</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        onClick={async () => {
                          const { error: updateError } = await supabase
                            .from("mentor_change_requests")
                            .update({ status: "approved" })
                            .eq("id", request.id);

                          if (updateError) {
                            toast.error("Failed to approve request");
                            return;
                          }

                          // Update user's mentor
                          await supabase
                            .from("user_mentors")
                            .delete()
                            .eq("user_id", request.user_id)
                            .eq("slot", request.slot);

                          await supabase
                            .from("user_mentors")
                            .insert({
                              user_id: request.user_id,
                              mentor_id: request.requested_mentor_id,
                              slot: request.slot
                            });

                          toast.success("Request approved!");
                          fetchMentorRequests();
                        }}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={async () => {
                          const { error } = await supabase
                            .from("mentor_change_requests")
                            .update({ status: "rejected" })
                            .eq("id", request.id);

                          if (error) {
                            toast.error("Failed to reject request");
                          } else {
                            toast.success("Request rejected");
                            fetchMentorRequests();
                          }
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {mentorRequests.filter((req: any) => req.status === 'pending').length === 0 && (
                <p className="text-center text-muted-foreground py-8">No pending requests</p>
              )}
            </div>

            {mentorRequests.filter((req: any) => req.status !== 'pending').length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Request History</h3>
                <div className="space-y-2">
                  {mentorRequests.filter((req: any) => req.status !== 'pending').map((request: any) => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded text-sm">
                      <div>
                        <p className="font-medium">{request.profile?.username}</p>
                        <p className="text-muted-foreground">
                          Slot {request.slot}: {request.current_mentor?.name || "Empty"} → {request.requested_mentor?.name}
                        </p>
                      </div>
                      <Badge variant={request.status === 'approved' ? 'default' : 'destructive'}>
                        {request.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Missions Tab */}
      <TabsContent value="missions">
        <div className="space-y-6">
          {/* Data Missions Section */}
          <Card>
            <CardHeader>
              <CardTitle>Data Missions</CardTitle>
              <CardDescription>Single question, 15 second timer, 10-15 XP + 1 token</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold">Add New Data Mission</h3>
                <div>
                  <Label>Question</Label>
                  <Input
                    value={newDataMission.question}
                    onChange={(e) => setNewDataMission({ ...newDataMission, question: e.target.value })}
                    placeholder="Enter mission question"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {newDataMission.options.map((opt, idx) => (
                    <div key={idx}>
                      <Label>Option {idx + 1}</Label>
                      <Input
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...newDataMission.options];
                          newOpts[idx] = e.target.value;
                          setNewDataMission({ ...newDataMission, options: newOpts });
                        }}
                        placeholder={`Option ${idx + 1}`}
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <Label>Correct Answer</Label>
                  <Select
                    value={newDataMission.correct_answer}
                    onValueChange={(value) => setNewDataMission({ ...newDataMission, correct_answer: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select correct answer" />
                    </SelectTrigger>
                    <SelectContent>
                      {newDataMission.options.filter(o => o).map((opt, idx) => (
                        <SelectItem key={idx} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Image (Optional)</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleMissionImageUpload(e, "data")}
                      disabled={uploadingImage}
                    />
                    {newDataMission.image_url && (
                      <img src={newDataMission.image_url} alt="Preview" className="w-20 h-20 object-cover rounded" />
                    )}
                  </div>
                </div>
                <Button onClick={handleAddDataMission} disabled={uploadingImage}>
                  <Upload className="mr-2 h-4 w-4" />
                  Add Data Mission
                </Button>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Existing Data Missions</h3>
                <div className="space-y-3">
                  {dataMissions.map((mission: any) => (
                    <div key={mission.id} className="flex items-start justify-between p-4 border rounded">
                      <div className="flex-1">
                        <p className="font-medium">{mission.question}</p>
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {(Array.isArray(mission.options) ? mission.options : []).map((opt: string, idx: number) => (
                            <Badge key={idx} variant={opt === mission.correct_answer ? "default" : "outline"}>
                              {opt}
                            </Badge>
                          ))}
                        </div>
                        {mission.image_url && (
                          <img src={mission.image_url} alt="Mission" className="mt-2 w-24 h-24 object-cover rounded" />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={mission.is_active ? "default" : "outline"}
                          onClick={() => handleToggleMission(mission.id, mission.is_active)}
                        >
                          {mission.is_active ? "Active" : "Inactive"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteMission(mission.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                  {dataMissions.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No data missions yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* World Missions Section */}
          <Card>
            <CardHeader>
              <CardTitle>World Missions</CardTitle>
              <CardDescription>3 questions, no timer, 15-22 XP + 2 tokens</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 mb-6">
                <h3 className="font-semibold">Add New World Mission (3 Questions)</h3>
                {newWorldMission.questions.map((question, qIdx) => (
                  <Card key={qIdx} className="p-4">
                    <h4 className="font-medium mb-3">Question {qIdx + 1}</h4>
                    <div className="space-y-3">
                      <div>
                        <Label>Question</Label>
                        <Input
                          value={question.question}
                          onChange={(e) => {
                            const updated = [...newWorldMission.questions];
                            updated[qIdx].question = e.target.value;
                            setNewWorldMission({ ...newWorldMission, questions: updated });
                          }}
                          placeholder="Enter question"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {question.options.map((opt, oIdx) => (
                          <div key={oIdx}>
                            <Label>Option {oIdx + 1}</Label>
                            <Input
                              value={opt}
                              onChange={(e) => {
                                const updated = [...newWorldMission.questions];
                                updated[qIdx].options[oIdx] = e.target.value;
                                setNewWorldMission({ ...newWorldMission, questions: updated });
                              }}
                              placeholder={`Option ${oIdx + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                      <div>
                        <Label>Correct Answer</Label>
                        <Select
                          value={question.correct_answer}
                          onValueChange={(value) => {
                            const updated = [...newWorldMission.questions];
                            updated[qIdx].correct_answer = value;
                            setNewWorldMission({ ...newWorldMission, questions: updated });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select correct answer" />
                          </SelectTrigger>
                          <SelectContent>
                            {question.options.filter(o => o).map((opt, idx) => (
                              <SelectItem key={idx} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Image (Optional)</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleMissionImageUpload(e, "world", qIdx)}
                            disabled={uploadingImage}
                          />
                          {question.image_url && (
                            <img src={question.image_url} alt="Preview" className="w-20 h-20 object-cover rounded" />
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                <Button onClick={handleAddWorldMission} disabled={uploadingImage}>
                  <Upload className="mr-2 h-4 w-4" />
                  Add World Mission
                </Button>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Existing World Missions</h3>
                <div className="space-y-4">
                  {worldMissions.map((mission: any) => (
                    <div key={mission.id} className="border rounded p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium">World Mission</h4>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={mission.is_active ? "default" : "outline"}
                            onClick={() => handleToggleMission(mission.id, mission.is_active)}
                          >
                            {mission.is_active ? "Active" : "Inactive"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteMission(mission.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {mission.world_mission_questions?.sort((a: any, b: any) => a.question_order - b.question_order).map((q: any, idx: number) => (
                          <div key={q.id} className="pl-4 border-l-2">
                            <p className="text-sm font-medium">Q{idx + 1}: {q.question}</p>
                            <div className="mt-1 flex gap-2 flex-wrap">
                              {(Array.isArray(q.options) ? q.options : []).map((opt: string, oIdx: number) => (
                                <Badge key={oIdx} variant={opt === q.correct_answer ? "default" : "outline"} className="text-xs">
                                  {opt}
                                </Badge>
                              ))}
                            </div>
                            {q.image_url && (
                              <img src={q.image_url} alt="Question" className="mt-2 w-20 h-20 object-cover rounded" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {worldMissions.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No world missions yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
