import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Copy, Share2, Gift, Users, Check, Sparkles, Calendar, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { triggerConfetti, triggerEmoji } from "@/utils/celebrations";
import { motion } from "framer-motion";

interface ReferralData {
  code: string;
  validReferrals: number;
  rewardsEarned: number;
}

interface ReferralCardProps {
  compact?: boolean;
}

const ReferralCard = ({ compact = false }: ReferralCardProps) => {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Please sign in to view your referral code");
        setLoading(false);
        return;
      }

      // Get or create referral code
      let { data: codeData, error: fetchError } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching referral code:", fetchError);
        throw new Error("Failed to fetch referral code");
      }

      if (!codeData) {
        // Generate new code
        const { data: newCode, error: genError } = await supabase.rpc("generate_referral_code");
        
        if (genError) {
          console.error("Error generating code:", genError);
          throw new Error("Failed to generate referral code");
        }
        
        const { data: insertedCode, error: insertError } = await supabase
          .from("referral_codes")
          .insert({ user_id: user.id, code: newCode })
          .select()
          .single();
        
        if (insertError) {
          console.error("Error inserting code:", insertError);
          throw new Error("Failed to save referral code");
        }
        
        codeData = insertedCode;
      }

      // Get valid referral count
      const { data: referralsData, error: refError } = await supabase
        .from("referral_uses")
        .select("id")
        .eq("referral_code_id", codeData?.id)
        .eq("is_valid", true);

      if (refError) {
        console.error("Error fetching referrals:", refError);
      }

      // Get rewards count using RPC
      const { data: rewardsCount, error: rewardsError } = await supabase
        .rpc("get_referral_rewards_count", { _user_id: user.id });

      if (rewardsError) {
        console.error("Error fetching rewards:", rewardsError);
      }

      setReferralData({
        code: codeData?.code || "",
        validReferrals: referralsData?.length || 0,
        rewardsEarned: rewardsCount || 0,
      });
    } catch (err) {
      console.error("Error fetching referral data:", err);
      setError(err instanceof Error ? err.message : "Failed to load referral data");
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  const handleRetry = () => {
    setRetrying(true);
    setLoading(true);
    fetchReferralData();
  };

  const copyCode = async () => {
    if (!referralData?.code) return;
    
    await navigator.clipboard.writeText(referralData.code);
    setCopied(true);
    toast.success("Referral code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = async () => {
    if (!referralData?.code) return;

    const shareText = `Join Vistari and get AI-powered revision timetables! Use my referral code: ${referralData.code}\n\n${window.location.origin}/auth?ref=${referralData.code}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Vistari - Early Supporters Event",
          text: shareText,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success("Share link copied to clipboard!");
    }
  };

  const shareWhatsApp = () => {
    if (!referralData?.code) return;
    const text = encodeURIComponent(`Join Vistari and get AI-powered revision timetables! Use my referral code: ${referralData.code}\n\n${window.location.origin}/auth?ref=${referralData.code}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  if (loading) {
    return compact ? null : (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (error && !compact) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="py-6 text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRetry} disabled={retrying} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? "Retrying..." : "Try Again"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentProgress = (referralData?.validReferrals || 0) % 5;
  const progressPercent = (currentProgress / 5) * 100;
  const referralsToNextReward = 5 - currentProgress;
  const nextRewardNumber = (referralData?.rewardsEarned || 0) + 1;

  // Compact version for header
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 cursor-pointer hover:from-orange-500/20 hover:to-amber-500/20 transition-all">
        <Gift className="h-4 w-4 text-orange-500" />
        <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
          {referralData?.validReferrals || 0}/5
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden">
        {/* Limited Time Banner */}
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 p-2 text-center">
          <div className="flex items-center justify-center gap-2 text-white text-sm font-semibold">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span>🎉 LIMITED TIME - Early Supporters Event!</span>
            <Sparkles className="h-4 w-4 animate-pulse" />
          </div>
        </div>

        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Refer Friends & Earn Rewards</CardTitle>
            </div>
            {(referralData?.rewardsEarned || 0) > 0 && (
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                {referralData?.rewardsEarned} Rewards Earned!
              </Badge>
            )}
          </div>
          <CardDescription className="text-sm">
            Every 5 friends you refer, you earn <strong>+1 Timetable Creation</strong> and <strong>+1 Timetable Regeneration</strong>!
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 pt-2">
          {/* How it works */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
              <Calendar className="h-4 w-4 text-primary" />
              <div className="text-xs">
                <span className="font-semibold text-primary">+1 Creation</span>
                <span className="text-muted-foreground"> per 5 refs</span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/10 border border-secondary/20">
              <RefreshCw className="h-4 w-4 text-secondary" />
              <div className="text-xs">
                <span className="font-semibold text-secondary">+1 Regen</span>
                <span className="text-muted-foreground"> per 5 refs</span>
              </div>
            </div>
          </div>

          {/* Referral Code */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Your Referral Code</label>
            <div className="flex gap-2">
              <Input 
                value={referralData?.code || ""} 
                readOnly 
                className="font-mono text-lg font-bold tracking-wider text-center"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={copyCode}
                className="shrink-0"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Progress to Next Reward */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Progress to Reward #{nextRewardNumber}
              </span>
              <span className="text-muted-foreground font-medium">
                {currentProgress}/5 friends
              </span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {referralsToNextReward > 0 
                ? `${referralsToNextReward} more friend${referralsToNextReward === 1 ? '' : 's'} to unlock your next reward!`
                : "🎉 You've earned a reward!"
              }
            </p>
            <p className="text-xs text-muted-foreground">
              Total referrals: <strong>{referralData?.validReferrals || 0}</strong> • 
              Rewards earned: <strong>{referralData?.rewardsEarned || 0}</strong>
            </p>
          </div>

          {/* Share Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={shareReferral}
              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Link
            </Button>
            <Button 
              onClick={shareWhatsApp}
              variant="outline"
              className="bg-green-500/10 border-green-500/30 hover:bg-green-500/20"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-green-600">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ReferralCard;