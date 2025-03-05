import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = "https://64b0c83bc60b8f941af5fdab.mockapi.io/product";

export default function Detail({ route, navigation }) {
  const { id } = route.params;
  const [product, setProduct] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      axios.get(`${API_URL}/${id}`)
        .then((response) => {
          setProduct(response.data);
          setIsFavorite(response.data.status);
        })
        .catch((error) => console.error("Lỗi lấy dữ liệu:", error))
        .finally(() => setLoading(false));
    });

    return unsubscribe;
  }, [id, navigation]);

  const toggleFavorite = async () => {
    try {
      const newStatus = !isFavorite;
      await axios.put(`${API_URL}/${id}`, { status: newStatus });

      if (newStatus) {
        await AsyncStorage.setItem(
          `product_${id}`,
          JSON.stringify({
            id,
            status: 1,
            image: product.image,
            artName: product.artName,
            price: product.price,
          })
        );
      } else {
        await AsyncStorage.removeItem(`product_${id}`);
      }
      setIsFavorite(newStatus);
    } catch (error) {
      console.error("Lỗi khi đổi trạng thái yêu thích:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6347" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy sản phẩm</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <TouchableOpacity  onPress={() => navigation.navigate("BottomTab", { screen: "Home" })} style={styles.backButton}>
        <Icon name="arrow-back" size={24} color="#333" />
        <Text style={styles.backText}>Back to Home</Text>
        </TouchableOpacity>
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image }} style={styles.image} />
          <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteButton}>
            <Icon name={isFavorite ? 'favorite' : 'favorite-outline'} size={28}  />
          </TouchableOpacity>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.name}>{product.artName}</Text>
          <Text style={styles.description}>{product.description}</Text>
          <Text style={styles.price}>{product.price} đ</Text>
        </View>

      <Text style={styles.feedbackTitle}>Feedback</Text>
      {product.feedbacks && product.feedbacks.length > 0 ? (
        <FlatList
          data={product.feedbacks}
          nestedScrollEnabled={true}
          scrollEnabled={false}
          keyExtractor={(feedback, index) => index.toString()}
          renderItem={({ item: feedback }) => (
            <View style={styles.feedbackItem}>
              <Text style={styles.feedbackAuthor}>{feedback.author}:</Text>
              <Text style={styles.feedbackComment}>{feedback.comment}</Text>
              <Text style={styles.feedbackRating}>⭐{feedback.rating}/5</Text>
            </View>
          )}
        />
      ) : (
        <Text style={styles.noFeedbackText}>Chưa có đánh giá nào.</Text>
      )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  container: {
    width: "100%",
    backgroundColor: "#fff",
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginBottom: 10,
    alignSelf: "flex-start",
    marginTop: 10,
  },
  backText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 5,
    color: "#333",
  },
  imageContainer: {
    position: "relative",
    alignItems: "center",
    paddingTop: 20,
  },
  image: {
    width: "90%",
    height: 250,
    borderRadius: 15,
  },
  favoriteButton: {
    position: "absolute",
    top: -20,
    right: 15,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 20,
    elevation: 3,
  },
  detailsContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginTop: 5,
  },
  price: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "#ff6347",
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "red",
  },
  feedbackTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
  },
  feedbackItem: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    width: '100%',
  },
  feedbackAuthor: {
    fontWeight: 'bold',
  },
  feedbackComment: {
    fontSize: 16,
    marginVertical: 5,
  },
  feedbackRating: {
    fontSize: 14,
    color: 'goldenrod',
  },
  noFeedbackText: {
    fontSize: 16,
    color: 'gray',
    marginTop: 10,
  },
});
