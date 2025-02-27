import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Typography, Spin, message } from 'antd';
import { useWebRelated } from '../context/WebRelatedContext';

const { Title, Text } = Typography;

const UserOrders = () => {
  const { t, i18n } = useTranslation();
  const { getAllOrdersForUser } = useWebRelated();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const fetchedOrders = await getAllOrdersForUser();
        setOrders(fetchedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        message.error(t('errors.fetchOrders'));
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [getAllOrdersForUser, t]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Title level={2}>{t('userOrders.title')}</Title>
      {orders.length === 0 ? (
        <Text>{t('userOrders.noOrders')}</Text>
      ) : (
        orders.map((order) => (
          <Card key={order.order_id} className="mb-4">
            <Title level={4}>{t('userOrders.orderNumber', { number: order.order_id })}</Title>
            <Text>{t('userOrders.orderDate', { date: new Date(order.order_date).toLocaleDateString() })}</Text>
            <Text>{t('userOrders.totalAmount', { amount: order.total_amount })}</Text>
            <Text>{t('userOrders.status', { status: order.status })}</Text>
            <Title level={5}>{t('userOrders.items')}</Title>
            {order.order_items.map((item, index) => (
              <div key={index} className="mb-2">
                <Text>{i18n.language === 'ar' ? item.ar_title : item.en_title}</Text>
                <Text>{t('userOrders.quantity', { quantity: item.quantity })}</Text>
                <Text>{t('userOrders.price', { price: item.price })}</Text>
              </div>
            ))}
          </Card>
        ))
      )}
    </div>
  );
};

export default UserOrders;