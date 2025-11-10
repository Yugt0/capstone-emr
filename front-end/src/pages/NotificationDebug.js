import React, { useState, useEffect } from 'react';

const NotificationDebug = () => {
  const [contraceptives, setContraceptives] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch contraceptives
    fetch('http://127.0.0.1:8000/api/contraceptive-inventory')
      .then(res => res.json())
      .then(data => {
        setContraceptives(data);
        console.log('Contraceptives loaded:', data.length);
      })
      .catch(err => console.error('Error fetching contraceptives:', err));

    // Fetch vaccines
    fetch('http://127.0.0.1:8000/api/vaccine-lists')
      .then(res => res.json())
      .then(data => {
        setVaccines(data);
        console.log('Vaccines loaded:', data.length);
        setLoading(false);
      })
      .catch(err => console.error('Error fetching vaccines:', err));
  }, []);

  const checkExpiringContraceptives = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(today.getMonth() + 1);
    oneMonthFromNow.setHours(23, 59, 59, 999);
    
    console.log('Today:', today);
    console.log('One month from now:', oneMonthFromNow);
    
    const expiring = contraceptives.filter(contraceptive => {
      if (!contraceptive.expiration_date) return false;
      
      const expirationDate = new Date(contraceptive.expiration_date);
      expirationDate.setHours(0, 0, 0, 0);
      
      const isExpiring = expirationDate <= oneMonthFromNow && expirationDate >= today;
      const hasStock = contraceptive.quantity > 0;
      
      console.log(`${contraceptive.contraceptive_name}: expires ${expirationDate}, isExpiring: ${isExpiring}, hasStock: ${hasStock}`);
      
      return isExpiring && hasStock;
    });
    
    return expiring;
  };

  const checkExpiringVaccines = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(today.getMonth() + 1);
    oneMonthFromNow.setHours(23, 59, 59, 999);
    
    const expiring = vaccines.filter(vaccine => {
      if (!vaccine.expiration_date) return false;
      
      const expirationDate = new Date(vaccine.expiration_date);
      expirationDate.setHours(0, 0, 0, 0);
      
      const isExpiring = expirationDate <= oneMonthFromNow && expirationDate >= today;
      const hasStock = vaccine.remaining_balance > 0;
      
      console.log(`${vaccine.product}: expires ${expirationDate}, isExpiring: ${isExpiring}, hasStock: ${hasStock}`);
      
      return isExpiring && hasStock;
    });
    
    return expiring;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const expiringContraceptives = checkExpiringContraceptives();
  const expiringVaccines = checkExpiringVaccines();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Notification Debug Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Contraceptives ({contraceptives.length} total)</h2>
        <p>Expiring within 1 month: {expiringContraceptives.length}</p>
        {expiringContraceptives.map((item, index) => (
          <div key={index} style={{ border: '1px solid #ccc', padding: '10px', margin: '5px' }}>
            <strong>{item.contraceptive_name}</strong><br/>
            Expires: {item.expiration_date}<br/>
            Quantity: {item.quantity}
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Vaccines ({vaccines.length} total)</h2>
        <p>Expiring within 1 month: {expiringVaccines.length}</p>
        {expiringVaccines.map((item, index) => (
          <div key={index} style={{ border: '1px solid #ccc', padding: '10px', margin: '5px' }}>
            <strong>{item.product}</strong><br/>
            Expires: {item.expiration_date}<br/>
            Remaining: {item.remaining_balance}
          </div>
        ))}
      </div>

      <div>
        <h3>All Contraceptives with Expiration Dates:</h3>
        {contraceptives.filter(c => c.expiration_date).map((item, index) => (
          <div key={index} style={{ fontSize: '12px', margin: '2px' }}>
            {item.contraceptive_name} - {item.expiration_date} (Qty: {item.quantity})
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationDebug;




