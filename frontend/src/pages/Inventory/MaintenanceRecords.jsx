
import React, { useCallback, useEffect, useState } from "react";
import { Card, Row, Col } from "antd";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import "../../index.css";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { HomeOutlined } from "@mui/icons-material";
import { Breadcrumb, Table, Button, Input, Modal, notification } from "antd";
import axios from "axios";
import { Link,useNavigate,useLocation } from "react-router-dom";
import moment from "moment";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Pie } from 'react-chartjs-2';  // Import Pie from react-chartjs-2
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js'; // Chart.js components

const { Search } = Input;
Chart.register(ArcElement, Tooltip, Legend);

const menuItems = [
  { name: 'Home', path: '/Inventory/InventoryDashboard' },
  { name: 'Fertilizers & Agrochemicals', path: '/Inventory/FertilizerRecords' },
  { name: 'Equipments & Machines', path: '/Inventory/EquipmentRecords' },
  { name: 'Maintenance Records', path: '/Inventory/MaintenanceRecords' },
  { name: 'Request Payment Details', path: '/Inventory/RequestPaymentRecords' }
];
const MaintenanceRecords = () => {
  const [maintenance, setMaintenance] = useState([]);
  const [filteredMaintenance, setFilteredMaintenance] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sorter, setSorter] = useState({ field: null, order: null });
  const navigate = useNavigate();
  const location = useLocation();
  const activePage = location.pathname;

  const fetchMaintenance = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/maintenance');
      setMaintenance(response.data.data);
      setFilteredMaintenance(response.data.data);
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
    }
  };

  useEffect(() => {
    fetchMaintenance();
  }, []);

  const onBackClick = useCallback(() => {
    navigate(-1);
  }, [navigate]);



  const onSearch = (value) => {
    setSearchText(value);
    filterMaintenance(value, filterStatus);
  };


  const filterMaintenance = (searchText, filterStatus) => {
    let filteredData = maintenance;
  
    if (searchText) {
      const lowercasedSearchText = searchText.toLowerCase();
      filteredData = filteredData.filter((maintenance) => 
        Object.values(maintenance).some((value) => 
          String(value).toLowerCase().includes(lowercasedSearchText)
        )
      );
    }
  
    if (filterStatus !== "All") {
      filteredData = filteredData.filter((maintenance) => maintenance.status === filterStatus);
    }
  
    if (sorter.field) {
      filteredData = [...filteredData].sort((a, b) => {
        if (sorter.order === 'ascend') {
          return a[sorter.field] > b[sorter.field] ? 1 : -1;
        } else {
          return a[sorter.field] < b[sorter.field] ? 1 : -1;
        }
      });
    }
  
    setFilteredMaintenance(filteredData);
  };

  const generatePDF = async () => {
    const doc = new jsPDF();

    // Load the logo image
    const logoUrl = "../src/assets/logo.png";
    let logoDataURL;
    try {
      logoDataURL = await getImageDataURL(logoUrl);
    } catch (error) {
      console.error("Failed to load the logo image:", error);
    }

    // Function to draw header and footer
    const drawHeaderFooter = (data) => {
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

   
      // Header
    doc.setFontSize(14);
    doc.text("Sobha Plantation", 10, 10); // Align left

    doc.setFontSize(10);
    doc.text("317/23, Nikaweratiya,", 10, 15); // Address line 1
    doc.text("Kurunagala, Sri Lanka.", 10, 20); // Address line 2
    doc.text("Email: sobhaplantationsltd@gmail.com", 10, 25); // Email address line
    doc.text("Contact: 0112 751 757", 10, 30); // Email address line

    if (logoDataURL) {
      doc.addImage(logoDataURL, 'PNG', pageWidth - 50, 10, 40, 10); // Align right (adjust the x position as needed)
    }

    doc.line(10, 35, pageWidth - 10, 35); // Header line
      
      // Footer
      doc.setFontSize(10);
      const currentPage = `Page ${
        data.pageNumber
      } of ${doc.internal.getNumberOfPages()}`;
      doc.text(currentPage, pageWidth - 30, pageHeight - 10); // Page number in footer
    };

    // Title for the report
    doc.setFontSize(22);
    doc.text("Maintenance Records Report", 50, 48); // Adjusted for placement below header

  // Define the table columns
    const columns = [
      { title: "Date Referred", dataKey: "referredDate" },
      { title: "Equipment", dataKey: "equipment" },
      { title: "Quantity", dataKey: "quantity" },
      { title: "Referred Location", dataKey: "referredLocation" },
      { title: "Received Date", dataKey: "receivedDate" },
      { title: "Status", dataKey: "status" },
    ];
  
    // Map the filteredMaintenance data to match the columns
    const rows = filteredMaintenance.map(maintenance => ({
      referredDate: moment(maintenance.reffereddate).format("YYYY-MM-DD"),
      equipment: maintenance.eqname,
      quantity: maintenance.quantity,
      referredLocation: maintenance.referredlocation,
      receivedDate: moment(maintenance.receiveddate).format("YYYY-MM-DD"),
      status: maintenance.status,
    }));

    // Add table with column and row data
    doc.autoTable({
      columns: columns,
      body: rows,
      startY: 60, // Set the table to start below the title and logo
      margin: { horizontal: 10 },
      styles: {
        fontSize: 10,
      },
      headStyles: {
        fillColor: [64, 133, 126], // Table header background color
        textColor: [255, 255, 255], // Table header text color
        fontSize: 12,
      },
      theme: "striped",
      didDrawPage: drawHeaderFooter, // Draw header and footer on each page
    });

    // Save the PDF
    doc.save("maintenance_records_report.pdf");
  };

  const getImageDataURL = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = (error) => {
        reject(error);
      };
    });
  };



  const handleSort = (field, order) => {
    setSorter({ field, order });
    filterMaintenance(searchText, filterStatus);
  };

  const cancelSorting = () => {
    setSorter({ field: null, order: null });
    filterMaintenance(searchText, filterStatus);
  };

  const handleUpdate = (id) => {
    navigate(`/Inventory/EditMaintenanceRecord/${id}`);
  };
  
  const confirmDelete = (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this record?",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk: () => handleDelete(id),
    });
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`http://localhost:5000/api/maintenance/${id}`);
      if(response.status === 200) {
        notification.success({
          message: 'Success',
          description: 'Maintenance record deleted successfully!',
        });
        // Update local state to remove the deleted record
        setFilteredMaintenance(filteredMaintenance.filter(record => record._id !== id));
      } else {
        notification.error({
          message: 'Error',
          description: 'There was an error deleting the maintenance record.',
        });
      }
    } catch (error) {
      console.error('Error deleting record:', error.response?.data?.message || error.message);
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || 'There was an error deleting the maintenance record.',
      });
    }
  };

  const getStatusCounts = () => {
    const statusCounts = {
      inprogress: 0,
      completed: 0,
      
    };

   
    maintenance.forEach((maintenance) => {
      const status = maintenance.status.toLowerCase();
      if (status === "in progress") {
        statusCounts.inprogress += 1;
      } else if (status === "completed") {
        statusCounts.completed += 1;
   
      }
    });

    return statusCounts;
  };

  const statusCounts = getStatusCounts();

  const pieData = {
    labels: ['In Progress', 'Completed'],
    datasets: [
      {
        label: 'Maintenance Status',
        data: [statusCounts.inprogress, statusCounts.completed],
        backgroundColor: ['#000080', '#40B5AD'],
        hoverBackgroundColor: ['#4169E1', '#40E0D0'],
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            const value = tooltipItem.raw;
            return `${tooltipItem.label}: ${value}`;
          },
        },
      },
    },
  };


  const isActive = (page) => activePage === page;

  return (

    <div className="flex flex-col min-h-screen bg-gray-100">
    <Header />
    <div className="flex flex-1">
      <Sidebar />
      <div className="ml-[300px] pt-3 flex-1">
        {/* Navigation Bar */}
        <nav className="sticky z-10 bg-gray-100 bg-opacity-50 border-b top-16 backdrop-blur">
          <div className="flex items-center justify-center">
            <ul className="flex flex-row items-center w-full h-8 gap-2 text-xs font-medium text-gray-800">
              <ArrowBackIcon className="rounded-full hover:bg-[#abadab] p-2" onClick={onBackClick} />
              {menuItems.map((item) => (
                <li key={item.name} className={`flex ${isActive(item.path) ? "text-gray-100 bg-gradient-to-tr from-emerald-500 to-lime-400 rounded-full" : "hover:bg-lime-200 rounded-full"}`}>
                  <Link to={item.path} className="flex items-center px-2">{item.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
               {/* Breadcrumb and Gallery Button */}
  <div className="flex items-center justify-between mb-5">
          <Breadcrumb
            items={[
              {
                href: '',
                title: <HomeOutlined />,
              },
              {
                title: 'Inventory',
              },
              {
                title: 'MaintenanceRecords',
              },
            ]}
          />
      </div>


                         {/* Pie chart for status visualization */}
                         <div className="flex flex-col items-center justify-center w-full mt-6 mb-10"> {/* Adjust the width and height as needed */}
                    <h3>Status of Maintenance</h3>
  <div style={{ width: '400px', height: '300px' }}>
  <Pie data={pieData} options={pieOptions} />
</div>
</div>
          {/* Page Header */}
          <header className="flex items-center justify-between px-6 py-4 mb-6 bg-white shadow-md">
            <h1 className="text-2xl font-bold"
            style={{ marginBottom: '24px', fontWeight: 'bold', color: '#1D6660' }}>
              Maintenance Overview</h1>
            <div className="flex items-center space-x-4">

                <Search
                  placeholder="Search by any field"
                  onChange={(e) => onSearch(e.target.value)}  // Trigger filter on input change
                  style={{ width: 200 }}
                  value={searchText}  // Keep the input controlled
                />
                <Button 
                  style={{ backgroundColor: "#22c55e", color: "#fff" }} 
                  onClick={() => navigate("/Inventory/AddMaintenanceRecord")}
                >
                  Add Records
                </Button>
                <Button 
                  style={{ backgroundColor: "#22c55e", color: "#fff" }} 
                  onClick={generatePDF}
                >
                  Generate PDF Report
                </Button>
              </div>
            </header>


            <Table
              columns={[
                {
                  title: "Date Reffered To",
                  dataIndex: "reffereddate",
                  key: "reffereddate",
                  sorter: true,
                  sortOrder: sorter.field === 'reffereddate' ? sorter.order : null,
                  render: (text) => moment(text).format("YYYY-MM-DD"),
                },
                 {
                  title: "Equipment/Machine",
                  dataIndex: "eqname",
                  key: "eqname",
                  sorter: true,
                  sortOrder: sorter.field === 'eqname' ? sorter.order : null,
                },
                {
                  title: "Quantity",
                  dataIndex: "quantity",
                  key: "quantity",
                  sorter: true,
                  sortOrder: sorter.field === 'quantity' ? sorter.order : null,
                },
             
                {
                  title: "Referred Location",
                  dataIndex: "referredlocation",
                  key: "referredlocation",
                  sorter: true,
                  sortOrder: sorter.field === 'referredlocation' ? sorter.order : null,
                },
                {
                  title: "Receive Date",
                  dataIndex: "receiveddate",
                  key: "receiveddate",
                  sorter: true,
                  sortOrder: sorter.field === 'receiveddate' ? sorter.order : null,
                  render: (text) => moment(text).format("YYYY-MM-DD"),
                },
                {
                  title: "Status",
                  dataIndex: "status",
                  key: "status",
                  sorter: true,
                  sortOrder: sorter.field === 'status' ? sorter.order : null,
                },
                {
                  title: "Actions",
                  key: "actions",
                  render: (text, record) => (
                    <span>
                      <Button type="link" onClick={() => handleUpdate(record._id)}>
                        Edit
                      </Button>
                      <Button type="link" danger onClick={() => confirmDelete(record._id)}>
                        Delete
                      </Button>
                    </span>
                  ),
                },
              ]}
              dataSource={filteredMaintenance}
              rowKey="_id"
              pagination={false}  // Disable pagination
             // Optional: Add vertical scroll if there are many rows
              onChange={(pagination, filters, sorter) => {
                if (sorter && sorter.order) {
                  handleSort(sorter.field, sorter.order);
                } else {
                  cancelSorting();
                }
              }}
            />
          </div>
        </div>
      </div>
  
  );
};

export default MaintenanceRecords;
