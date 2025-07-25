// src/components/StatusTracking.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { campService, dataProcessors, apiService } from './api.js';
import PatientStatus from './PatientStatus';
import { FileText } from 'lucide-react'; 
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { 
  MapPin, 
  Calendar, 
  Users, 
  Activity, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Building,
  Stethoscope,
  Target,
  PieChart
} from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);



const colors = {
  aqua: '#0cc0df',
  green: '#7ed957',
  darkGrey: '#3c3b3f',
  purple: '#944cdd'
};

function StatusTracking() {
  const [activeCamps, setActiveCamps] = useState([]);
  const [allCamps, setAllCamps] = useState([]);
  const [campDetailsMap, setCampDetailsMap] = useState({});
  for (const campId in campDetailsMap) {
  const camp = campDetailsMap[campId];

  // Only if technician_summary exists
  if (Array.isArray(camp.technician_summary)) {
    camp.technician_summary = camp.technician_summary.map(tech => {
      // Calculate total and completed services
      const total = tech.services?.reduce((sum, s) => sum + (Number(s.total) || 0), 0) || 0;
      const completed = tech.services?.reduce((sum, s) => sum + (Number(s.completed) || 0), 0) || 0;

      return {
        ...tech,
        total,
        completed
      };
    });
  }}
  const [totalTechnicians, setTotalTechnicians] = useState(0);
  const [serviceChartData, setServiceChartData] = useState(null);
  const [serviceStats, setServiceStats] = useState([]);
  const [showPatientStatus, setShowPatientStatus] = useState(false);

  useEffect(() => {
    // Use the new service methods
    campService.getActiveCamps()
      .then(readyCamps => setActiveCamps(readyCamps))
      .catch(err => console.error('Error fetching active camps:', err));
  
    campService.getAllCamps()
      .then(camps => setAllCamps(camps))
      .catch(err => console.error('Error fetching all camps:', err));
  }, []);

  useEffect(() => {
    const fetchDetails = async () => {
      if (activeCamps.length === 0) return;
  
      try {
        const campIds = activeCamps.map(camp => camp.id);
        const campDetailsMap = await campService.getMultipleCampDetails(campIds);
        
        setCampDetailsMap(campDetailsMap);
        setTotalTechnicians(dataProcessors.calculateUniqueTechnicians(campDetailsMap));
        
        const { serviceCountMap, serviceStatsArray } = dataProcessors.processServiceStats(campDetailsMap);
        setServiceStats(serviceStatsArray);
        
        // Create service chart data with existing color scheme
        const serviceNames = Object.keys(serviceCountMap);
        const chartColors = [
          colors.aqua,
          colors.green,
          colors.purple,
          colors.aqua + '80',
          colors.green + '80',
          colors.purple + '80',
          colors.darkGrey + '80'
        ];
  
        setServiceChartData({
          labels: serviceNames,
          datasets: [
            {
              label: 'Services Executed',
              data: Object.values(serviceCountMap),
              backgroundColor: chartColors.slice(0, serviceNames.length),
              borderColor: '#ffffff',
              borderWidth: 2,
            },
          ],
        });
        
      } catch (error) {
        console.error('Error fetching camp details:', error);
      }
    };
  
    fetchDetails();
  }, [activeCamps]);

  const getGroupedCampsByLocation = () => {
    return dataProcessors.groupCampsByLocation(activeCamps);
  };

  const getClientName = () => (allCamps.length ? allCamps[0].client : '');
  const groupedCamps = getGroupedCampsByLocation();

  const getTotalPatients = () =>
  Object.values(campDetailsMap).reduce(
    (sum, camp) => sum + (camp.completed_patients || 0), 0
  );

  const getCompletionRate = () => {
    const completedCamps = Object.values(campDetailsMap).filter(camp => camp.is_completed).length;
    return activeCamps.length > 0 ? Math.round((completedCamps / activeCamps.length) * 100) : 0;
  };

  const getTotalCompletedServices = () => {
    return Object.values(campDetailsMap).reduce((total, camp) => total + (camp.completed_services || 0), 0);
  };

  const getTotalServices = () => {
    return Object.values(campDetailsMap).reduce((total, camp) => total + (camp.total_services || 0), 0);
  };

  const getTotalPatientsTotal = () =>
    Object.values(campDetailsMap).reduce(
      (sum, camp) => sum + (camp.total_patients || 0), 0
    );



  if (showPatientStatus) {
    return <PatientStatus onBack={() => setShowPatientStatus(false)} />;
  }


  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      {/* Header */}
      {/* Header */}
      <div className="px-6 py-4 shadow-sm" style={{ backgroundColor: colors.darkGrey }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Health Camp Dashboard</h1>
            <p className="text-gray-300 flex items-center gap-2 mt-1">
              <Building size={16} />
              {getClientName()}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Patient Status Button */}
            <button
              onClick={() => setShowPatientStatus(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
              style={{ backgroundColor: colors.aqua }}
            >
              <FileText size={18} />
              Patient Status
            </button>
            <div className="text-right text-white">
              <p className="text-sm opacity-75">Last updated</p>
              <p className="font-semibold">{new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
      

      {/* Stats Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Camps YTD"
            value={allCamps.length}
            icon={<Building size={24} />}
            color={colors.aqua}
            subtitle="All registered camps"
          />
          <StatCard
            title="Active Camps"
            value={activeCamps.length}
            icon={<Activity size={24} />}
            color={colors.green}
            subtitle="Ready-to-go camps"
          />
          <StatCard
            title="Total Technicians"
            value={totalTechnicians}
            icon={<Users size={24} />}
            color={colors.purple}
            subtitle="Active personnel"
          />
          <StatCard
            title="Patients Served"
            value={getTotalPatients()}
            icon={<Stethoscope size={24} />}
            color={colors.darkGrey}
            subtitle="Across all camps"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.darkGrey }}>
              <PieChart size={20} />
              Service Distribution
            </h3>
            
            {serviceChartData ? (
              <>
                <div className="h-48 mb-4">
                  <Pie 
                    data={serviceChartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            boxWidth: 12,
                            font: { size: 10 },
                            padding: 8
                          }
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return `${context.label}: ${context.parsed} services`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
                
                <div className="space-y-4">
                  {serviceStats.map((service, index) => {
                    const colorArray = [colors.aqua, colors.green, colors.purple];
                    const serviceColor = colorArray[index % colorArray.length];
                    
                    return (
                      <div key={service.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: serviceColor }}
                          ></div>
                          <span className="font-medium">{service.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold" style={{ color: serviceColor }}>
                            {service.count}
                          </span>
                          <span className="text-sm text-gray-500 ml-2">
                            ({service.percentage}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center">
                <p className="text-gray-500">Loading chart data...</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.darkGrey }}>
              <TrendingUp size={20} />
              Key Metrics
            </h3>
            <div className="space-y-4">
              <MetricItem
                label="Completion Rate"
                value={`${getCompletionRate()}%`}
                progress={getCompletionRate()}
                color={colors.green}
              />
              <MetricItem
                label="Service Progress"
                value={`${getTotalCompletedServices()} / ${getTotalServices()}`}
                progress={getTotalServices() > 0 ? Math.round((getTotalCompletedServices() / getTotalServices()) * 100) : 0}
                color={colors.aqua}
              />
              <MetricItem
                label="Patient Progress"
                value={`${getTotalPatients()} / ${getTotalPatientsTotal()}`}
                progress={getTotalPatientsTotal() > 0 ? Math.round((getTotalPatients() / getTotalPatientsTotal()) * 100) : 0}
                color={colors.purple}
              />
            </div>
          </div>
        </div>

        {/* Camps by Location */}
        <div className="space-y-6">
          {Object.entries(groupedCamps).map(([location, camps]) => (
            <div key={location} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b" style={{ backgroundColor: '#f8fafc' }}>
                <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: colors.darkGrey }}>
                  <MapPin size={20} />
                  {location}
                  <span className="text-sm font-normal opacity-60">({camps.length} camps)</span>
                </h3>
              </div>
              
              <div className="p-6">
                <div className="grid gap-4">
                  {camps.map(camp => {
                    const details = campDetailsMap[camp.id];
                    if (!details) return (
                      <div key={camp.id} className="border rounded-lg p-4">
                        <p className="text-gray-500">Loading camp details...</p>
                      </div>
                    );

                    const progressPercentage = details.total_services > 0 ? Math.round((details.completed_services / details.total_services) * 100) : 0;
                    const patientProgressPercentage = details.total_patients > 0 ? Math.round((details.completed_patients / details.total_patients) * 100) : 0;

                    return (
                      <div key={camp.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-lg" style={{ color: colors.darkGrey }}>
                              {details.camp_name}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {details.start_date} - {details.end_date}
                              </span>
                              {details.district && details.state && (
                                <span>{details.district}, {details.state}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {details.is_completed ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white" style={{ backgroundColor: colors.green }}>
                                <CheckCircle size={14} />
                                Completed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white" style={{ backgroundColor: colors.aqua }}>
                                <Clock size={14} />
                                In Progress
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <ProgressCard
                            title="Services Progress"
                            current={details.completed_services}
                            total={details.total_services}
                            percentage={progressPercentage}
                            color={colors.aqua}
                          />
                          <div>
                            <p className="text-sm">Patient Progress</p>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                              <div
                                className="h-2.5 rounded-full"
                                style={{
                                  width: `${details.total_patients > 0 
                                    ? Math.round((details.completed_patients / details.total_patients) * 100)
                                    : 0}%`,
                                  backgroundColor: colors.purple,
                                }}
                              ></div>
                            </div>
                            <div className="text-xs text-right text-purple-600">
                              {details.completed_patients || 0} / {details.total_patients || 0}
                            </div>
                          </div>

                        </div>

                        {details.technician_summary?.length > 0 && (
                          <div className="border-t pt-4">
                            <h5 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.darkGrey }}>
                              <Users size={16} />
                              Technician Performance
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {details.technician_summary.map((tech, idx) => (
                                <div key={idx} className="border rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-sm">{tech.technician || 'Unassigned'}</span>
                                    <span className="text-xs text-gray-500">{tech.completed}/{tech.total}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="h-2 rounded-full transition-all duration-300"
                                      style={{ 
                                        width: `${tech?.total && tech?.completed !== undefined ? Math.round((tech.completed / tech.total) * 100) : 0}%`,
                                        backgroundColor: colors.green 
                                      }}

                                    ></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {details.service_summary?.length > 0 && (
                          <div className="border-t pt-4 mt-4">
                            <h5 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.darkGrey }}>
                              <Target size={16} />
                              Service Breakdown
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {details.service_summary.map((service, idx) => (
                                <div key={idx} className="border rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-sm">{service.service__name}</span>
                                    <span className="text-xs text-gray-500">{service.completed}/{service.total || service.completed}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="h-2 rounded-full transition-all duration-300"
                                      style={{ 
                                        width: `${service.total ? Math.round((service.completed / service.total) * 100) : 100}%`,
                                        backgroundColor: colors.aqua 
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {details.packages?.length > 0 && (
                          <div className="border-t pt-4 mt-4">
                            <h5 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.darkGrey }}>
                              <Building size={16} />
                              Package Progress
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {details.packages.map((pkg, idx) => (
                                <div key={idx} className="border rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-sm">{pkg.package_name}</span>
                                    <span className="text-xs text-gray-500">{pkg.completed_patients}/{pkg.total_patients}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="h-2 rounded-full transition-all duration-300"
                                      style={{ 
                                        width: `${pkg.total_patients > 0 ? Math.round((pkg.completed_patients / pkg.total_patients) * 100) : 0}%`,
                                        backgroundColor: colors.purple 
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border-l-4" style={{ borderLeftColor: color }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      </div>
      <div className="p-3 rounded-full" style={{ backgroundColor: color + '20', color }}>
        {icon}
      </div>
    </div>
  </div>
);

const MetricItem = ({ label, value, progress, color }) => (
  <div>
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <span className="text-sm font-bold" style={{ color }}>{value}</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className="h-2 rounded-full transition-all duration-300"
        style={{ width: `${progress}%`, backgroundColor: color }}
      ></div>
    </div>
  </div>
);

const ProgressCard = ({ title, current, total, percentage, color }) => (
  <div className="border rounded-lg p-4">
    <div className="flex justify-between items-center mb-2">
      <h6 className="font-medium text-sm text-gray-600">{title}</h6>
      <span className="text-sm font-bold">{current}/{total}</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
      <div 
        className="h-2 rounded-full transition-all duration-300"
        style={{ width: `${percentage}%`, backgroundColor: color }}
      ></div>
    </div>
    <p className="text-xs text-gray-500">{percentage}% Complete</p>
  </div>
);

export default StatusTracking;
