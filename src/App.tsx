import {useState, ChangeEvent, useEffect} from 'react';
import {Power, Shield, Camera, Upload, LoaderCircle, ArrowLeft, Check, X, User, Circle, Menu, Users, Briefcase, Home, Building, MoreVertical, Building2, CreditCard, Sparkles, Share2, LogOut, UserCircle} from 'lucide-react';
import {motion} from 'motion/react';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface Submission {
  id: string;
  type: 'tenant' | 'subscription';
  profile: string;
  idDocs: string;
  status: 'pending' | 'approved' | 'rejected';
  active: boolean;
  paymentProof: string | null;
  paymentStatus: 'pending' | 'approved' | 'rejected' | null;
  referredBy: string | null;
  subscriptionFee: number;
  activatedAt: number | null;
}

interface AppSettings {
  adminTenantLimit: number;
  adminSubLimit: number;
  tenantTenantLimit: number;
  tenantSubLimit: number;
}

export default function App() {
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [showAdminView, setShowAdminView] = useState(false);
  const [adminMenu, setAdminMenu] = useState<'Overview' | 'Verification' | 'UserPoP' | 'TenantPoP' | 'Tenants' | 'Users' | 'Settings'>('Overview');
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [tenantMenu, setTenantMenu] = useState<'Overview' | 'Verification' | 'UserPoP' | 'TenantPoP' | 'Referrals' | 'Pricing' | 'Tenants' | 'Users'>('Overview');
  const [showTenantMenu, setShowTenantMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'seekers' | 'gigs' | 'tenant-portal' | 'user-portal'>('home');
  const [userMenu, setUserMenu] = useState<'Profile Logo' | 'Profile Info' | 'Subscription Countdown'>('Profile Logo');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activationStep, setActivationStep] = useState<'options' | 'upload' | 'review'>('options');
  const [selectedOption, setSelectedOption] = useState<'tenant' | 'subscription' | null>(null);
  const [files, setFiles] = useState<{profile: string | null; idDocs: string | null; paymentProof: string | null}>({profile: null, idDocs: null, paymentProof: null});
  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const saved = localStorage.getItem('submissions');
    return saved ? JSON.parse(saved) : [];
  });
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('appSettings');
    return saved ? JSON.parse(saved) : {
      adminTenantLimit: 100,
      adminSubLimit: 1000,
      tenantTenantLimit: 10,
      tenantSubLimit: 100
    };
  });
  const [referredBy, setReferredBy] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [visitCount, setVisitCount] = useState(() => {
    const saved = localStorage.getItem('visitCount');
    return saved ? parseInt(saved, 10) : Math.floor(Math.random() * 50) + 10;
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setReferredBy(ref);
  }, []);

  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const newCount = visitCount + 1;
    setVisitCount(newCount);
    localStorage.setItem('visitCount', newCount.toString());
  }, []);

  useEffect(() => {
    localStorage.setItem('submissions', JSON.stringify(submissions));
  }, [submissions]);

  const adminCounts = {
    Overview: submissions.length,
    Verification: submissions.filter(s => s.status === 'pending').length,
    UserPoP: submissions.filter(s => s.type === 'subscription' && s.paymentProof).length,
    TenantPoP: submissions.filter(s => s.type === 'tenant' && s.paymentProof).length,
    Tenants: submissions.filter(s => s.type === 'tenant').length,
    Users: submissions.filter(s => s.type === 'subscription').length,
    Settings: 4
  };

  const isTenantReferral = referredBy && referredBy.startsWith('tenant-');
  const relevantSubmissions = submissions.filter(s => 
    isTenantReferral ? s.referredBy === referredBy : !s.referredBy
  );

  const tenantSpotsRemaining = isTenantReferral 
    ? settings.tenantTenantLimit - relevantSubmissions.filter(s => s.type === 'tenant').length
    : settings.adminTenantLimit - relevantSubmissions.filter(s => s.type === 'tenant').length;

  const subSpotsRemaining = isTenantReferral
    ? settings.tenantSubLimit - relevantSubmissions.filter(s => s.type === 'subscription').length
    : settings.adminSubLimit - relevantSubmissions.filter(s => s.type === 'subscription').length;

  const [showActiveStatusModal, setShowActiveStatusModal] = useState(false);

  const handleActivationClick = () => {
    if (mySubmission?.active) {
      setShowActiveStatusModal(true);
    } else {
      setActivationStep('options');
      setShowActivationModal(true);
    }
  };

  const handleAdminClick = () => setShowAdminView(true);

  const resetActivation = () => {
    setShowActivationModal(false);
    setActivationStep('options');
    setSelectedOption(null);
    setFiles({profile: null, idDocs: null, paymentProof: null});
  };

  const handleSubmit = () => {
    if (files.profile && files.idDocs && selectedOption) {
      const isTenantReferral = referredBy && referredBy.startsWith('tenant-');
      const relevantSubmissions = submissions.filter(s => 
        (isTenantReferral ? s.referredBy === referredBy : !s.referredBy) && 
        s.type === selectedOption
      );
      
      const limit = isTenantReferral 
        ? (selectedOption === 'tenant' ? settings.tenantTenantLimit : settings.tenantSubLimit)
        : (selectedOption === 'tenant' ? settings.adminTenantLimit : settings.adminSubLimit);

      if (relevantSubmissions.length >= limit) {
        alert(`Limit reached: Only ${limit} ${selectedOption} spots available via this link.`);
        return;
      }

      setSubmissions(prev => [...prev, {
        id: Date.now().toString(),
        type: selectedOption,
        profile: files.profile!,
        idDocs: files.idDocs!,
        status: 'pending',
        active: false,
        paymentProof: null,
        paymentStatus: null,
        referredBy: referredBy,
        subscriptionFee: selectedOption === 'tenant' ? 299.99 : 29.99,
        activatedAt: null
      }]);
      setActivationStep('review');
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, type: 'profile' | 'idDocs' | 'paymentProof') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFiles(prev => ({...prev, [type]: reader.result as string}));
      };
      reader.readAsDataURL(file);
    }
  };

  const updateSubmissionStatus = (id: string, field: 'status' | 'paymentStatus', value: 'approved' | 'rejected') => {
    setSubmissions(prev => prev.map(s => {
      if (s.id === id) {
        const isNowActive = (field === 'paymentStatus' && value === 'approved');
        return {
          ...s, 
          [field]: value, 
          active: isNowActive,
          activatedAt: isNowActive ? Date.now() : s.activatedAt
        };
      }
      return s;
    }));
  };

  const toggleActiveStatus = (id: string) => {
    setSubmissions(prev => prev.map(s => s.id === id ? {...s, active: !s.active} : s));
  };

  const handleBack = () => {
    if (activationStep === 'upload') setActivationStep('options');
  };

  if (activeTab === 'user-portal') {
    const userSub = submissions[submissions.length - 1];

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="h-screen bg-gray-50 p-6 overflow-y-auto relative flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => setShowUserMenu(!showUserMenu)} className="p-2 bg-white rounded-full shadow hover:bg-gray-100">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">User Portal - {userMenu}</h1>
          <button onClick={() => setActiveTab('home')} className="p-2 bg-white rounded-full shadow hover:bg-gray-100">
            <X className="w-6 h-6" />
          </button>
        </div>

        {showUserMenu && (
            <div className="absolute top-16 left-6 bg-white shadow-lg rounded-2xl p-2 w-64 z-10">
                {(['Profile Logo', 'Profile Info', 'Subscription Countdown'] as const).map(item => (
                    <button key={item} onClick={() => {setUserMenu(item); setShowUserMenu(false);}} className="flex items-center w-full p-3 hover:bg-gray-100 rounded-lg text-sm font-medium">
                        <span>{item}</span>
                    </button>
                ))}
                <button 
                    onClick={() => {
                        setShowUserMenu(false);
                        setSubmissions(prev => prev.slice(0, -1));
                        setActiveTab('home');
                    }} 
                    className="flex items-center gap-2 w-full p-3 hover:bg-gray-100 rounded-lg text-red-600 font-medium mt-1 border-t border-gray-100"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                </button>
            </div>
        )}

        <div className="max-w-lg mx-auto w-full bg-white p-8 rounded-3xl shadow-sm space-y-6">
          {userMenu === 'Profile Logo' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <img src={userSub?.profile || ''} className="w-32 h-32 object-cover rounded-full shadow-lg border-4 border-white" alt="Profile Logo" />
              <h3 className="font-bold text-xl">Verified User Profile</h3>
            </div>
          )}

          {userMenu === 'Profile Info' && (
            <div className="space-y-4">
              <h3 className="font-bold text-xl mb-4">Profile Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-500">Account Type</span>
                  <span className="font-semibold uppercase">{userSub?.type}</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-500">Account Status</span>
                  <span className="font-semibold text-green-600">Active</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-500">ID Verification</span>
                  <span className="font-semibold text-blue-600">Verified</span>
                </div>
              </div>
            </div>
          )}

          {userMenu === 'Subscription Countdown' && (
            <div className="text-center py-8 space-y-4">
              <h3 className="font-bold text-xl">Subscription Countdown</h3>
              <div className="p-8 bg-blue-50 border border-blue-100 rounded-3xl inline-block w-full">
                <p className="text-4xl font-black text-blue-900">
                  {userSub?.activatedAt ? Math.max(0, 30 - Math.floor((Date.now() - userSub.activatedAt) / (1000 * 60 * 60 * 24))) : '30'} Days
                </p>
                <p className="text-xs text-blue-600 mt-1 uppercase tracking-widest font-bold">Remaining in current cycle</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  if (activeTab === 'tenant-portal') {
    const tenantSubmissions = submissions.filter(s => s.type === 'tenant');
    const filteredTenant = tenantSubmissions.filter(s => {
      if (tenantMenu === 'Verification') return s.status === 'pending';
      if (tenantMenu === 'UserPoP') return false;
      if (tenantMenu === 'TenantPoP') return s.paymentProof !== null;
      if (tenantMenu === 'Referrals') return false;
      return true; // Overview
    });

    const latestTenant = tenantSubmissions[tenantSubmissions.length - 1];
    const myReferralCode = `tenant-${latestTenant?.id}`;
    const myReferrals = submissions.filter(s => s.referredBy === myReferralCode);
    const referralLink = `${window.location.origin}${window.location.pathname}?ref=${myReferralCode}`;

    const tenantCounts = {
      Overview: tenantSubmissions.length,
      Verification: tenantSubmissions.filter(s => s.status === 'pending').length,
      UserPoP: 0,
      TenantPoP: tenantSubmissions.filter(s => s.paymentProof !== null).length,
      Referrals: myReferrals.length,
      Pricing: 1,
      Tenants: myReferrals.filter(s => s.type === 'tenant').length,
      Users: myReferrals.filter(s => s.type === 'subscription').length
    };

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="h-screen bg-gray-50 p-6 overflow-y-auto relative flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => setShowTenantMenu(!showTenantMenu)} className="p-2 bg-white rounded-full shadow hover:bg-gray-100">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Tenant Portal - {tenantMenu}</h1>
          <button onClick={() => setActiveTab('home')} className="p-2 bg-white rounded-full shadow hover:bg-gray-100">
            <X className="w-6 h-6" />
          </button>
        </div>

        {showTenantMenu && (
            <div className="absolute top-16 left-6 bg-white shadow-lg rounded-2xl p-2 w-56 z-10">
                {(['Overview', 'Verification', 'UserPoP', 'TenantPoP', 'Referrals', 'Pricing', 'Tenants', 'Users'] as const).map(item => (
                    <button key={item} onClick={() => {setTenantMenu(item); setShowTenantMenu(false);}} className="flex justify-between items-center w-full p-3 hover:bg-gray-100 rounded-lg">
                        <span>{item}</span>
                        <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full font-semibold">{tenantCounts[item]}</span>
                    </button>
                ))}
                <button 
                    onClick={() => {
                        setShowTenantMenu(false);
                        if (navigator.share) {
                            navigator.share({
                                title: document.title,
                                url: referralLink
                            }).catch(() => {});
                        } else {
                            navigator.clipboard.writeText(referralLink);
                            alert('Tenant referral link copied to clipboard!');
                        }
                    }} 
                    className="flex items-center gap-2 w-full p-3 hover:bg-gray-100 rounded-lg text-blue-600 font-medium mt-1 border-t border-gray-100"
                >
                    <Share2 className="w-4 h-4" />
                    <span>Share Referral Link</span>
                </button>
                <button 
                    onClick={() => {
                        setShowTenantMenu(false);
                        setSubmissions(prev => prev.slice(0, -1));
                        setActiveTab('home');
                    }} 
                    className="flex items-center gap-2 w-full p-3 hover:bg-gray-100 rounded-lg text-red-600 font-medium border-t border-gray-100"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                </button>
            </div>
        )}

        {tenantMenu === 'Referrals' ? (
          <div className="bg-white p-8 rounded-3xl shadow-sm space-y-6 max-w-lg mx-auto w-full">
            <h3 className="text-xl font-bold">My Referrals & Sharing</h3>
            <p className="text-sm text-gray-500">Share your unique referral link with prospective tenants and manage your referrals.</p>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 uppercase">Your Unique Referral Link</label>
              <div className="flex gap-2">
                <input type="text" readOnly value={referralLink} className="bg-gray-50 border p-3 rounded-xl w-full text-sm font-mono text-gray-700" />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(referralLink);
                    alert('Referral link copied!');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold text-sm shrink-0"
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-blue-950">Total Successful Referrals</p>
                <p className="text-3xl font-black text-blue-900 mt-1">{myReferrals.length}</p>
              </div>
              <button 
                onClick={() => {
                    if (navigator.share) {
                        navigator.share({ title: 'Join as Tenant', url: referralLink }).catch(() => {});
                    } else {
                        navigator.clipboard.writeText(referralLink);
                        alert('Link copied to clipboard!');
                    }
                }}
                className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow"
              >
                Share Link
              </button>
            </div>
          </div>
        ) : tenantMenu === 'Overview' ? (
          <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto w-full">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Referral Profit</p>
              <p className="text-xl font-black text-blue-900">
                R{((myReferrals.filter(s => s.active && s.type === 'tenant').length * 299.99) + 
                   (myReferrals.filter(s => s.active && s.type === 'subscription').length * (latestTenant?.subscriptionFee || 0))).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[9px] font-semibold text-gray-400 tracking-tight">Live</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Payout Balance</p>
              <p className="text-xl font-black text-indigo-900">R0,00</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                <span className="text-[9px] font-semibold text-gray-400 tracking-tight">Pending</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Total Referrals</p>
                <p className="text-2xl font-black text-gray-900">{myReferrals.length}</p>
              </div>
              <Users className="w-6 h-6 text-blue-100" />
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Active Refs</p>
                <p className="text-2xl font-black text-gray-900">{myReferrals.filter(s => s.active).length}</p>
              </div>
              <Check className="w-6 h-6 text-green-100" />
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between col-span-2">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Link Clicks</p>
                <p className="text-2xl font-black text-gray-900">0</p>
              </div>
              <Sparkles className="w-6 h-6 text-yellow-100" />
            </div>
          </div>
        ) : tenantMenu === 'Pricing' ? (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6 max-w-md mx-auto w-full">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                <CreditCard className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Custom User Pricing</h3>
              <p className="text-sm text-gray-500">Set the monthly subscription fee for users who join through your link.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Monthly Fee (ZAR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-lg">R</span>
                  <input 
                    type="number" 
                    step="0.01"
                    value={latestTenant?.subscriptionFee || 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setSubmissions(prev => prev.map(s => s.id === latestTenant?.id ? {...s, subscriptionFee: val} : s));
                    }}
                    className="w-full bg-gray-50 border border-gray-100 p-4 pl-10 rounded-2xl text-xl font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                <p className="text-xs font-medium text-blue-800 leading-relaxed">
                  Your referral profit is calculated based on this fee. Adjusting this will affect all future and current users in your tier.
                </p>
              </div>
            </div>
            
            <p className="text-[10px] text-gray-400 text-center font-medium">Changes are saved automatically.</p>
          </div>
        ) : tenantMenu === 'Tenants' ? (
          <div className="grid gap-6">
            {myReferrals.filter(s => s.type === 'tenant').map(tenant => {
              const tenantRefCode = `tenant-${tenant.id}`;
              const refTenants = submissions.filter(s => s.referredBy === tenantRefCode && s.type === 'tenant' && s.active).length;
              const refUsers = submissions.filter(s => s.referredBy === tenantRefCode && s.type === 'subscription' && s.active).length;
              const monthlyProfit = (refTenants * 299.99) + (refUsers * tenant.subscriptionFee);
              
              return (
                <div key={tenant.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                  <div className="flex items-center gap-4">
                    <img src={tenant.profile} className="w-16 h-16 object-cover rounded-full shadow-sm border-2 border-gray-50" alt="Tenant Logo" />
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 leading-tight">Tenant ID: {tenant.id.slice(-6)}</h3>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{tenant.active ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-gray-50 p-4 rounded-2xl">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Tenant Refs</p>
                      <p className="text-xl font-black text-gray-900">{refTenants}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">User Refs</p>
                      <p className="text-xl font-black text-gray-900">{refUsers}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-2xl col-span-2 flex justify-between items-center border border-blue-100/50">
                      <div>
                        <p className="text-[10px] font-bold text-blue-400 uppercase">Monthly Profit</p>
                        <p className="text-2xl font-black text-blue-900">R{monthlyProfit.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-blue-400 uppercase italic">Sub Ends In</p>
                        <p className="text-sm font-bold text-blue-800">
                          {tenant.activatedAt ? Math.max(0, 30 - Math.floor((Date.now() - tenant.activatedAt) / (1000 * 60 * 60 * 24))) : '--'} Days
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleActiveStatus(tenant.id)}
                      className={`col-span-2 py-3 rounded-2xl font-bold text-sm transition-colors ${tenant.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                    >
                      {tenant.active ? 'Disable Account' : 'Enable Account'}
                    </button>
                  </div>
                </div>
              );
            })}
            {myReferrals.filter(s => s.type === 'tenant').length === 0 && (
              <div className="text-center py-12 text-gray-400 font-medium">No tenants referred yet.</div>
            )}
          </div>
        ) : tenantMenu === 'Users' ? (
          <div className="grid gap-6">
            {myReferrals.filter(s => s.type === 'subscription').map(user => {
              const userRefCode = `user-${user.id}`;
              const refCount = submissions.filter(s => s.referredBy === userRefCode).length;
              const daysLeft = user.activatedAt ? Math.max(0, 30 - Math.floor((Date.now() - user.activatedAt) / (1000 * 60 * 60 * 24))) : null;

              return (
                <div key={user.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                  <div className="flex items-center gap-4">
                    <img src={user.profile} className="w-14 h-14 object-cover rounded-full shadow-sm" alt="User Logo" />
                    <div className="flex-grow">
                      <h3 className="font-bold text-gray-900">User ID: {user.id.slice(-6)}</h3>
                      <p className="text-xs text-gray-400">Referred By: Me</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {user.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-4 rounded-2xl">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Referrals</p>
                      <p className="text-xl font-black text-gray-900">{refCount}</p>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100/50">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase">Days Left</p>
                      <p className="text-xl font-black text-indigo-900">{daysLeft !== null ? `${daysLeft} Days` : 'Not Started'}</p>
                    </div>
                    <button 
                      onClick={() => toggleActiveStatus(user.id)}
                      className={`col-span-2 py-3 rounded-2xl font-bold text-sm transition-colors ${user.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                    >
                      {user.active ? 'Disable Account' : 'Enable Account'}
                    </button>
                  </div>
                </div>
              );
            })}
            {myReferrals.filter(s => s.type === 'subscription').length === 0 && (
              <div className="text-center py-12 text-gray-400 font-medium">No subscription users referred yet.</div>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredTenant.map(sub => (
              <div key={sub.id} className="bg-white p-6 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">My Tenant Record</p>
                  <p className="text-sm text-gray-500">Status: {sub.status} | Active: {sub.active ? 'Yes' : 'No'}</p>
                </div>
                <div className="flex gap-4">
                  <img src={sub.profile} onClick={() => setFullScreenImage(sub.profile)} className="w-16 h-16 object-cover rounded-lg cursor-pointer" alt="Profile" />
                  <img src={sub.idDocs} onClick={() => setFullScreenImage(sub.idDocs)} className="w-16 h-16 object-cover rounded-lg cursor-pointer" alt="ID" />
                  {sub.paymentProof && <img src={sub.paymentProof} onClick={() => setFullScreenImage(sub.paymentProof)} className="w-16 h-16 object-cover rounded-lg cursor-pointer" alt="Proof" />}
                </div>
              </div>
            ))}
            {filteredTenant.length === 0 && (
              <div className="text-center text-gray-500 py-12">No records found for this category.</div>
            )}
          </div>
        )}

        {fullScreenImage && (
          <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4" onClick={() => setFullScreenImage(null)}>
            <img src={fullScreenImage} className="max-w-full max-h-full object-contain" alt="Full Screen" />
          </div>
        )}
      </motion.div>
    );
  }

  if (showAdminView) {
    const filteredSubmissions = submissions.filter(s => {
      if (adminMenu === 'Verification') return s.status === 'pending';
      if (adminMenu === 'UserPoP') return s.type === 'subscription' && s.paymentProof;
      if (adminMenu === 'TenantPoP') return s.type === 'tenant' && s.paymentProof;
      return true; // Overview
    });

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="h-screen bg-gray-50 p-6 overflow-y-auto relative">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => setShowAdminMenu(!showAdminMenu)} className="p-2 bg-white rounded-full shadow hover:bg-gray-100">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">{adminMenu}</h1>
          <button onClick={() => setShowAdminView(false)} className="p-2 bg-white rounded-full shadow hover:bg-gray-100">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {showAdminMenu && (
            <div className="absolute top-16 left-6 bg-white shadow-lg rounded-2xl p-2 w-56 z-10">
                {(['Overview', 'Verification', 'UserPoP', 'TenantPoP', 'Tenants', 'Users', 'Settings'] as const).map(item => (
                    <button key={item} onClick={() => {setAdminMenu(item); setShowAdminMenu(false);}} className="flex justify-between items-center w-full p-3 hover:bg-gray-100 rounded-lg">
                        <span>{item}</span>
                        <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full font-semibold">{adminCounts[item]}</span>
                    </button>
                ))}
                <button 
                    onClick={() => {
                        setShowAdminMenu(false);
                        if (navigator.share) {
                            navigator.share({
                                title: document.title,
                                url: window.location.href
                            }).catch(() => {});
                        } else {
                            navigator.clipboard.writeText(window.location.href);
                            alert('App link copied to clipboard!');
                        }
                    }} 
                    className="flex items-center gap-2 w-full p-3 hover:bg-gray-100 rounded-lg text-blue-600 font-medium mt-1 border-t border-gray-100"
                >
                    <Share2 className="w-4 h-4" />
                    <span>Share App</span>
                </button>
                <button 
                    onClick={() => {
                        setShowAdminMenu(false);
                        setShowAdminView(false);
                    }} 
                    className="flex items-center gap-2 w-full p-3 hover:bg-gray-100 rounded-lg text-red-600 font-medium border-t border-gray-100"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                </button>
            </div>
        )}

        <div className="grid gap-4">
          {adminMenu === 'Overview' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Tenant Profit</p>
                <p className="text-xl font-black text-blue-900">
                  R{(submissions.filter(s => s.type === 'tenant' && s.active).length * 299.99).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-[9px] font-semibold text-gray-400 tracking-tight">Live</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">User Profit</p>
                <p className="text-xl font-black text-indigo-900">
                  R{(submissions.filter(s => s.type === 'subscription' && s.active).length * 29.99).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-[9px] font-semibold text-gray-400 tracking-tight">Live</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Tenants</p>
                  <p className="text-2xl font-black text-gray-900">
                    {submissions.filter(s => s.type === 'tenant' && s.active).length}
                  </p>
                </div>
                <Building2 className="w-6 h-6 text-blue-100" />
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Users</p>
                  <p className="text-2xl font-black text-gray-900">
                    {submissions.filter(s => s.type === 'subscription' && s.active).length}
                  </p>
                </div>
                <Users className="w-6 h-6 text-indigo-100" />
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between col-span-2">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Visits</p>
                  <p className="text-2xl font-black text-gray-900">{visitCount}</p>
                </div>
                <Sparkles className="w-6 h-6 text-yellow-100" />
              </div>
            </div>
          ) : adminMenu === 'Tenants' ? (
            <div className="grid gap-6">
              {submissions.filter(s => s.type === 'tenant').map(tenant => {
                const tenantRefCode = `tenant-${tenant.id}`;
                const refTenants = submissions.filter(s => s.referredBy === tenantRefCode && s.type === 'tenant' && s.active).length;
                const refUsers = submissions.filter(s => s.referredBy === tenantRefCode && s.type === 'subscription' && s.active).length;
                const monthlyProfit = (refTenants * 299.99) + (refUsers * tenant.subscriptionFee);
                
                return (
                  <div key={tenant.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                    <div className="flex items-center gap-4">
                      <img src={tenant.profile} className="w-16 h-16 object-cover rounded-full shadow-sm border-2 border-gray-50" alt="Tenant Logo" />
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 leading-tight">Tenant ID: {tenant.id.slice(-6)}</h3>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{tenant.active ? 'Active' : 'Inactive'}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="bg-gray-50 p-4 rounded-2xl">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Tenant Refs</p>
                        <p className="text-xl font-black text-gray-900">{refTenants}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">User Refs</p>
                        <p className="text-xl font-black text-gray-900">{refUsers}</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-2xl col-span-2 flex justify-between items-center border border-blue-100/50">
                        <div>
                          <p className="text-[10px] font-bold text-blue-400 uppercase">Monthly Profit</p>
                          <p className="text-2xl font-black text-blue-900">R{monthlyProfit.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-blue-400 uppercase italic">Sub Ends In</p>
                          <p className="text-sm font-bold text-blue-800">
                            {tenant.activatedAt ? Math.max(0, 30 - Math.floor((Date.now() - tenant.activatedAt) / (1000 * 60 * 60 * 24))) : '--'} Days
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleActiveStatus(tenant.id)}
                        className={`col-span-2 py-3 rounded-2xl font-bold text-sm transition-colors ${tenant.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                      >
                        {tenant.active ? 'Disable Account' : 'Enable Account'}
                      </button>
                    </div>
                  </div>
                );
              })}
              {submissions.filter(s => s.type === 'tenant').length === 0 && (
                <div className="text-center py-12 text-gray-400 font-medium">No tenants registered yet.</div>
              )}
            </div>
          ) : adminMenu === 'Users' ? (
            <div className="grid gap-6">
              {submissions.filter(s => s.type === 'subscription').map(user => {
                const userRefCode = `user-${user.id}`;
                const refCount = submissions.filter(s => s.referredBy === userRefCode).length;
                const daysLeft = user.activatedAt ? Math.max(0, 30 - Math.floor((Date.now() - user.activatedAt) / (1000 * 60 * 60 * 24))) : null;

                return (
                  <div key={user.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                    <div className="flex items-center gap-4">
                      <img src={user.profile} className="w-14 h-14 object-cover rounded-full shadow-sm" alt="User Logo" />
                      <div className="flex-grow">
                        <h3 className="font-bold text-gray-900">User ID: {user.id.slice(-6)}</h3>
                        <p className="text-xs text-gray-400">Referred By: {user.referredBy || 'Admin'}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {user.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-4 rounded-2xl">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Referrals</p>
                        <p className="text-xl font-black text-gray-900">{refCount}</p>
                      </div>
                      <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100/50">
                        <p className="text-[10px] font-bold text-indigo-400 uppercase">Days Left</p>
                        <p className="text-xl font-black text-indigo-900">{daysLeft !== null ? `${daysLeft} Days` : 'Not Started'}</p>
                      </div>
                      <button 
                        onClick={() => toggleActiveStatus(user.id)}
                        className={`col-span-2 py-3 rounded-2xl font-bold text-sm transition-colors ${user.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                      >
                        {user.active ? 'Disable Account' : 'Enable Account'}
                      </button>
                    </div>
                  </div>
                );
              })}
              {submissions.filter(s => s.type === 'subscription').length === 0 && (
                <div className="text-center py-12 text-gray-400 font-medium">No subscription users found.</div>
              )}
            </div>
          ) : adminMenu === 'Settings' ? (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6 max-w-md mx-auto w-full mb-10">
              <h3 className="font-bold text-xl">App Limits (Global)</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Admin Link Tenant Limit</label>
                  <input 
                    type="number" 
                    value={settings.adminTenantLimit} 
                    onChange={e => setSettings(s => ({...s, adminTenantLimit: parseInt(e.target.value) || 0}))}
                    className="w-full bg-gray-50 border p-3 rounded-xl text-sm font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Admin Link User Limit</label>
                  <input 
                    type="number" 
                    value={settings.adminSubLimit} 
                    onChange={e => setSettings(s => ({...s, adminSubLimit: parseInt(e.target.value) || 0}))}
                    className="w-full bg-gray-50 border p-3 rounded-xl text-sm font-semibold"
                  />
                </div>
                <h3 className="font-bold text-xl pt-4">Referral Limits (Per Tenant)</h3>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Tenant Referral Limit</label>
                  <input 
                    type="number" 
                    value={settings.tenantTenantLimit} 
                    onChange={e => setSettings(s => ({...s, tenantTenantLimit: parseInt(e.target.value) || 0}))}
                    className="w-full bg-gray-50 border p-3 rounded-xl text-sm font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">User Referral Limit</label>
                  <input 
                    type="number" 
                    value={settings.tenantSubLimit} 
                    onChange={e => setSettings(s => ({...s, tenantSubLimit: parseInt(e.target.value) || 0}))}
                    className="w-full bg-gray-50 border p-3 rounded-xl text-sm font-semibold"
                  />
                </div>
              </div>
              <p className="text-[10px] text-gray-400 text-center">Settings are automatically saved to local storage.</p>
            </div>
          ) : (
            filteredSubmissions.map(sub => (
              <div key={sub.id} className="bg-white p-6 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">{sub.type === 'tenant' ? 'Tenant' : 'Subscription'} Request</p>
                  <p className="text-sm text-gray-500">Status: {sub.status}</p>
                </div>
                <div className="flex gap-4">
                  <img src={sub.profile} onClick={() => setFullScreenImage(sub.profile)} className="w-16 h-16 object-cover rounded-lg cursor-pointer" alt="Profile" />
                  <img src={sub.idDocs} onClick={() => setFullScreenImage(sub.idDocs)} className="w-16 h-16 object-cover rounded-lg cursor-pointer" alt="ID" />
                  {sub.paymentProof && <img src={sub.paymentProof} onClick={() => setFullScreenImage(sub.paymentProof)} className="w-16 h-16 object-cover rounded-lg cursor-pointer" alt="Proof" />}
                </div>
                <div className="flex gap-2">
                  {sub.status === 'pending' && (
                      <>
                          <button onClick={() => updateSubmissionStatus(sub.id, 'status', 'approved')} className="p-2 bg-green-100 text-green-700 rounded-full"><Check /></button>
                          <button onClick={() => updateSubmissionStatus(sub.id, 'status', 'rejected')} className="p-2 bg-red-100 text-red-700 rounded-full"><X /></button>
                      </>
                  )}
                  {sub.paymentProof && sub.paymentStatus !== 'approved' && (
                      <>
                          <button onClick={() => updateSubmissionStatus(sub.id, 'paymentStatus', 'approved')} className="p-2 bg-blue-100 text-blue-700 rounded-full"><Check /></button>
                          <button onClick={() => updateSubmissionStatus(sub.id, 'paymentStatus', 'rejected')} className="p-2 bg-orange-100 text-orange-700 rounded-full"><X /></button>
                      </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        {fullScreenImage && (
          <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4" onClick={() => setFullScreenImage(null)}>
            <img src={fullScreenImage} className="max-w-full max-h-full object-contain" alt="Full Screen" />
          </div>
        )}
      </motion.div>
    );
  }

  const mySubmission = submissions[submissions.length - 1];

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-4 gap-4 z-50">
        <div className="flex items-center gap-2">
          {mySubmission?.active && (
            <img src={mySubmission.profile} className="w-8 h-8 rounded-full object-cover" alt="Profile" />
          )}
          {mySubmission && (
            <Circle className={`w-4 h-4 ${mySubmission.active ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'}`} />
          )}
        </div>
        <div className="flex gap-4">
          <button aria-label="Activation" onClick={handleActivationClick} className="p-2 hover:bg-gray-100 rounded-full">
            <Power className={`w-6 h-6 ${mySubmission?.active ? 'text-green-500' : 'text-red-500'}`} />
          </button>
          <button aria-label="Admin" onClick={handleAdminClick} className="p-2 hover:bg-gray-100 rounded-full">
            <Shield className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </header>
      
      <main className="flex-grow p-4 pt-20 pb-20 bg-white">
        {activeTab === 'seekers' && (
          <div className="flex flex-col items-center justify-center h-full text-gray-800">
            <Users className="w-16 h-16 mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold">Seekers</h2>
          </div>
        )}
        {activeTab === 'gigs' && (
          <div className="flex flex-col items-center justify-center h-full text-gray-800">
            <Briefcase className="w-16 h-16 mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold">GiGs</h2>
          </div>
        )}
        {activeTab === 'home' && mySubmission && mySubmission.status === 'approved' && !mySubmission.active && (
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6 max-w-sm mx-auto">
            <h3 className="font-bold text-2xl text-gray-900">Payment Required</h3>
            <div className="space-y-3 text-sm text-gray-600 bg-gray-50 p-5 rounded-2xl">
              <div className="flex justify-between"><span>Account</span><span className="font-semibold text-gray-900">Capitec - Matthews</span></div>
              <div className="flex justify-between"><span>Account Number</span><span className="font-semibold text-gray-900">1334067366</span></div>
              <div className="flex justify-between"><span>Amount</span><span className="font-semibold text-gray-900">{mySubmission.type === 'tenant' ? 'R299,99' : 'R29,99'}</span></div>
              <div className="flex justify-between"><span>Ref</span><span className="font-semibold text-gray-900">{mySubmission.type === 'tenant' ? 'Ten29' : 'User29'}</span></div>
            </div>
            <label className="block cursor-pointer">
              <input type="file" className="hidden" onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setSubmissions(prev => prev.map((s,i) => i === prev.length-1 ? {...s, paymentProof: reader.result as string} : s));
                    };
                    reader.readAsDataURL(file);
                }
              }} />
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 p-4 rounded-2xl text-center text-sm font-medium hover:border-gray-400">
                  {mySubmission.paymentProof ? 'Change Proof of Payment' : 'Upload Proof of Payment'}
              </div>
            </label>
            {mySubmission.paymentProof && (
                <button 
                  onClick={() => {
                    setSubmissions(prev => prev.map((s,i) => i === prev.length-1 ? {...s, paymentStatus: 'pending'} : s));
                    setPaymentLoading(true);
                  }} 
                  disabled={mySubmission.paymentStatus === 'pending'}
                  className={`w-full py-3 rounded-2xl font-bold shadow-lg ${mySubmission.paymentStatus === 'pending' ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                    {mySubmission.paymentStatus === 'pending' ? 'Pending Review' : 'Submit Payment'}
                </button>
            )}
            {paymentLoading && (
              <div className="flex flex-col items-center gap-4 py-4">
                <LoaderCircle className="w-12 h-12 text-blue-500 animate-spin" />
                <p className="text-sm text-gray-500 text-center">Review takes 15 to 25 minutes.</p>
              </div>
            )}
          </div>
        )}
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-2xl border-t border-gray-100 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] flex items-center justify-around z-40 px-3">
        <button onClick={() => setActiveTab('seekers')} className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 ${activeTab === 'seekers' ? 'bg-gradient-to-t from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/30 -translate-y-1' : 'text-gray-500 hover:bg-gray-100/80'}`}>
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Seekers</span>
        </button>
        <button onClick={() => setActiveTab('gigs')} className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 ${activeTab === 'gigs' ? 'bg-gradient-to-t from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/30 -translate-y-1' : 'text-gray-500 hover:bg-gray-100/80'}`}>
          <Briefcase className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">GiGs</span>
        </button>
        {submissions[submissions.length - 1]?.type === 'tenant' && submissions[submissions.length - 1]?.active && (
          <button onClick={() => setActiveTab('tenant-portal')} className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 ${activeTab === 'tenant-portal' ? 'bg-gradient-to-t from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/30 -translate-y-1' : 'text-gray-500 hover:bg-gray-100/80'}`}>
            <Building className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-0.5">Tenant</span>
          </button>
        )}
        {submissions[submissions.length - 1]?.type === 'subscription' && submissions[submissions.length - 1]?.active && (
          <button onClick={() => setActiveTab('user-portal')} className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 ${activeTab === 'user-portal' ? 'bg-gradient-to-t from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/30 -translate-y-1' : 'text-gray-500 hover:bg-gray-100/80'}`}>
            <UserCircle className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-0.5">User</span>
          </button>
        )}
      </nav>

      {showActiveStatusModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowActiveStatusModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.15 }} className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative text-center space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Subscription Active</h3>
            <p className="text-sm text-gray-500">Your account is currently active and verified. The activation feature is locked until your subscription ends.</p>
            <button 
              onClick={() => {
                setSubmissions(prev => prev.map((s,i) => i === prev.length-1 ? {...s, active: false} : s));
                setShowActiveStatusModal(false);
                setActiveTab('home');
              }}
              className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              Simulate Subscription End (Unlock)
            </button>
            <button onClick={() => setShowActiveStatusModal(false)} className="text-xs text-gray-400">Close</button>
          </motion.div>
        </div>
      )}
      {showActivationModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={resetActivation}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.15 }} className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            {activationStep !== 'options' && (
              <button onClick={handleBack} className="absolute top-6 left-6 p-2 rounded-full hover:bg-gray-100">
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
            )}
            {activationStep === 'options' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-extrabold text-gray-900">Select Activation</h2>
                  <p className="text-sm text-gray-500 mt-1">Choose your membership tier to get started</p>
                </div>
                <div className="grid gap-4">
                  <button 
                    disabled={tenantSpotsRemaining <= 0}
                    onClick={() => { setSelectedOption('tenant'); setActivationStep('upload'); }}
                    className={`relative overflow-hidden bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-6 rounded-3xl shadow-xl text-left transition-transform group ${tenantSpotsRemaining <= 0 ? 'opacity-50 grayscale' : 'hover:scale-[1.02]'}`}
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Building2 className="w-24 h-24 text-white" />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                        <Building2 className="w-6 h-6 text-blue-200" />
                      </div>
                      <span className="text-xs uppercase tracking-widest bg-blue-500/30 px-3 py-1 rounded-full font-bold">Premium Tier</span>
                    </div>
                    <h3 className="text-xl font-bold mb-1">Become a Tenant</h3>
                    <p className="text-xs text-blue-200 mb-4">Full tenancy verification & property tools</p>
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-2xl font-black">R299,99<span className="text-xs font-normal text-blue-200">/mo</span></span>
                        <span className={`text-[10px] font-bold ${tenantSpotsRemaining < 5 ? 'text-red-400' : 'text-blue-300'}`}>{tenantSpotsRemaining} spots remaining</span>
                      </div>
                      <span className="text-xs font-semibold underline underline-offset-4">{tenantSpotsRemaining <= 0 ? 'Sold Out' : 'Select Plan →'}</span>
                    </div>
                  </button>

                  <button 
                    disabled={subSpotsRemaining <= 0}
                    onClick={() => { setSelectedOption('subscription'); setActivationStep('upload'); }}
                    className={`relative overflow-hidden bg-gradient-to-br from-gray-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl text-left transition-transform group ${subSpotsRemaining <= 0 ? 'opacity-50 grayscale' : 'hover:scale-[1.02]'}`}
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Sparkles className="w-24 h-24 text-white" />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                        <CreditCard className="w-6 h-6 text-indigo-200" />
                      </div>
                      <span className="text-xs uppercase tracking-widest bg-indigo-500/30 px-3 py-1 rounded-full font-bold">Standard Tier</span>
                    </div>
                    <h3 className="text-xl font-bold mb-1">User Subscription</h3>
                    <p className="text-xs text-indigo-200 mb-4">Platform access & gig matching</p>
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-2xl font-black">R29,99<span className="text-xs font-normal text-indigo-200">/mo</span></span>
                        <span className={`text-[10px] font-bold ${subSpotsRemaining < 20 ? 'text-red-400' : 'text-indigo-300'}`}>{subSpotsRemaining} spots remaining</span>
                      </div>
                      <span className="text-xs font-semibold underline underline-offset-4">{subSpotsRemaining <= 0 ? 'Sold Out' : 'Select Plan →'}</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
            
            {activationStep === 'upload' && (
              <div className="space-y-6 pt-10">
                <h2 className="text-xl font-bold text-center">{selectedOption === 'tenant' ? 'Tenant' : 'Subscription'} Activation</h2>
                <div className="space-y-4">
                  <label className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-gray-400">
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'profile')} />
                    {files.profile ? <img src={files.profile} className="w-24 h-24 object-cover rounded-lg" alt="Profile" /> : <Camera className="w-8 h-8 text-gray-400" />}
                    <span className="text-sm font-medium">{files.profile ? 'Change photo' : 'Upload profile picture (face only)'}</span>
                  </label>
                  <label className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-gray-400">
                    <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'idDocs')} />
                    {files.idDocs ? <img src={files.idDocs} className="w-24 h-24 object-cover rounded-lg" alt="ID" /> : <Upload className="w-8 h-8 text-gray-400" />}
                    <span className="text-sm font-medium">{files.idDocs ? 'Change document' : 'Upload ID documents'}</span>
                  </label>
                </div>
                <button 
                  onClick={handleSubmit}
                  className="w-full bg-black text-white py-3 rounded-xl font-semibold"
                >
                  Submit
                </button>
              </div>
            )}
            
            {activationStep === 'review' && (
              <div className="flex flex-col items-center gap-6 py-10">
                <LoaderCircle className="w-16 h-16 text-blue-500 animate-spin" />
                <div className="text-center">
                  <p className="text-lg font-semibold">Review in progress</p>
                  <p className="text-gray-500">This takes about 15 to 25 minutes.</p>
                </div>
                <button onClick={resetActivation} className="text-sm text-gray-400">Close</button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
